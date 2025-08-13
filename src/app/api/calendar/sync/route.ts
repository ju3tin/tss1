import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { google } from "googleapis"

// Helper function to get Google Calendar client
async function getGoogleCalendarClient(userId: string) {
  const syncConfig = await db.googleCalendarSync.findUnique({
    where: { user_id: userId }
  })

  if (!syncConfig || !syncConfig.access_token) {
    throw new Error("Google Calendar not configured")
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: syncConfig.access_token,
    refresh_token: syncConfig.refresh_token,
    expiry_date: syncConfig.token_expires_at?.getTime()
  })

  // Refresh token if expired
  if (syncConfig.token_expires_at && new Date(syncConfig.token_expires_at) < new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      // Update stored tokens
      await db.googleCalendarSync.update({
        where: { user_id: userId },
        data: {
          access_token: credentials.access_token!,
          refresh_token: credentials.refresh_token || syncConfig.refresh_token,
          token_expires_at: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          updated_at: new Date()
        }
      })
      
      oauth2Client.setCredentials(credentials)
    } catch (refreshError) {
      console.error("Failed to refresh access token:", refreshError)
      throw new Error("Failed to refresh access token")
    }
  }

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, enable, accessToken, events } = await request.json()

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    switch (action) {
      case 'toggle_sync':
        // Toggle Google Calendar sync on/off
        if (enable) {
          // Enable sync - create or update Google calendar sync record
          await db.googleCalendarSync.upsert({
            where: { user_id: session.user.id },
            create: {
              user_id: session.user.id,
              access_token: accessToken || "",
              is_sync_enabled: true,
              sync_direction: "BIDIRECTIONAL"
            },
            update: {
              is_sync_enabled: true,
              access_token: accessToken || "",
              updated_at: new Date()
            }
          })
        } else {
          // Disable sync
          await db.googleCalendarSync.upsert({
            where: { user_id: session.user.id },
            create: {
              user_id: session.user.id,
              access_token: "",
              is_sync_enabled: false,
              sync_direction: "BIDIRECTIONAL"
            },
            update: {
              is_sync_enabled: false,
              updated_at: new Date()
            }
          })
        }

        return NextResponse.json({
          message: enable ? "Google Calendar sync enabled" : "Google Calendar sync disabled"
        })

      case 'connect':
        // Store Google Calendar access token
        await db.googleCalendarSync.upsert({
          where: { user_id: session.user.id },
          create: {
            user_id: session.user.id,
            access_token: accessToken || "",
            is_sync_enabled: true,
            sync_direction: "BIDIRECTIONAL"
          },
          update: {
            access_token: accessToken || "",
            is_sync_enabled: true,
            updated_at: new Date()
          }
        })

        return NextResponse.json({
          message: "Google Calendar connected successfully"
        })

      case 'disconnect':
        // Remove Google Calendar integration
        await db.googleCalendarSync.upsert({
          where: { user_id: session.user.id },
          create: {
            user_id: session.user.id,
            access_token: "",
            is_sync_enabled: false,
            sync_direction: "BIDIRECTIONAL"
          },
          update: {
            access_token: "",
            is_sync_enabled: false,
            updated_at: new Date()
          }
        })

        return NextResponse.json({
          message: "Google Calendar disconnected successfully"
        })

      case 'sync_events':
        // Sync events from Google Calendar to local database
        try {
          const calendar = await getGoogleCalendarClient(session.user.id)
          
          // Get events from Google Calendar for the next 30 days
          const timeMin = new Date().toISOString()
          const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          
          const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime'
          })

          const googleEvents = response.data.items || []
          const syncedEvents = []
          
          for (const event of googleEvents) {
            if (!event.id || !event.start || !event.end) continue
            
            const existingEvent = await db.calendarEvent.findFirst({
              where: {
                user_id: session.user.id,
                google_event_id: event.id
              }
            })

            const eventData = {
              user_id: session.user.id,
              google_event_id: event.id,
              title: event.summary || 'Untitled Event',
              description: event.description || '',
              start_time: new Date(event.start.dateTime || event.start.date),
              end_time: new Date(event.end.dateTime || event.end.date),
              location: event.location || '',
              attendees: event.attendees ? JSON.stringify(event.attendees) : null,
              reminder_minutes: 15, // Default reminder
              is_synced_with_google: true,
              last_synced_at: new Date(),
              updated_at: new Date()
            }

            if (existingEvent) {
              // Update existing event
              const updated = await db.calendarEvent.update({
                where: { id: existingEvent.id },
                data: eventData
              })
              syncedEvents.push(updated)
            } else {
              // Create new event
              const created = await db.calendarEvent.create({
                data: {
                  ...eventData,
                  created_at: new Date()
                }
              })
              syncedEvents.push(created)
            }
          }

          // Update last sync time
          await db.googleCalendarSync.update({
            where: { user_id: session.user.id },
            data: { last_sync_at: new Date() }
          })

          return NextResponse.json({
            message: "Calendar events synced successfully",
            synced_events: syncedEvents.length
          })
        } catch (error) {
          console.error("Failed to sync events from Google Calendar:", error)
          return NextResponse.json({ error: "Failed to sync events from Google Calendar" }, { status: 500 })
        }

      case 'create_event':
        // Create event in Google Calendar
        if (!events || !Array.isArray(events) || events.length === 0) {
          return NextResponse.json({ error: "Event data is required" }, { status: 400 })
        }

        try {
          const calendar = await getGoogleCalendarClient(session.user.id)
          const eventToCreate = events[0] // Process first event
          
          // Create event in Google Calendar
          const googleEvent = {
            summary: eventToCreate.title,
            description: eventToCreate.description,
            start: {
              dateTime: new Date(eventToCreate.start_time).toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(eventToCreate.end_time).toISOString(),
              timeZone: 'UTC'
            },
            location: eventToCreate.location,
            attendees: eventToCreate.attendees ? eventToCreate.attendees.map((email: string) => ({ email })) : []
          }

          const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: googleEvent
          })

          const createdGoogleEvent = response.data
          
          // Create local event with Google event ID
          const localEvent = await db.calendarEvent.create({
            data: {
              user_id: session.user.id,
              google_event_id: createdGoogleEvent.id!,
              title: eventToCreate.title,
              description: eventToCreate.description,
              start_time: new Date(eventToCreate.start_time),
              end_time: new Date(eventToCreate.end_time),
              location: eventToCreate.location,
              attendees: eventToCreate.attendees ? JSON.stringify(eventToCreate.attendees) : null,
              reminder_minutes: eventToCreate.reminder_minutes || 15,
              is_synced_with_google: true,
              last_synced_at: new Date(),
              created_at: new Date()
            }
          })

          return NextResponse.json({
            message: "Calendar event created successfully",
            event: localEvent
          })
        } catch (error) {
          console.error("Failed to create event in Google Calendar:", error)
          return NextResponse.json({ error: "Failed to create event in Google Calendar" }, { status: 500 })
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in calendar sync:", error)
    return NextResponse.json(
      { error: "Failed to process calendar sync" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's Google sync status
    const googleSync = await db.googleCalendarSync.findUnique({
      where: { user_id: session.user.id }
    })

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { user_id: session.user.id }
    
    if (startDate && endDate) {
      where.start_time = {
        gte: new Date(startDate)
      }
      where.end_time = {
        lte: new Date(endDate)
      }
    }

    const events = await db.calendarEvent.findMany({
      where,
      orderBy: {
        start_time: 'asc'
      }
    })

    // Parse attendees JSON for each event
    const parsedEvents = events.map(event => ({
      ...event,
      attendees: event.attendees ? JSON.parse(event.attendees) : []
    }))

    return NextResponse.json({
      events: parsedEvents,
      googleSync: {
        isEnabled: googleSync?.is_sync_enabled || false,
        lastSyncAt: googleSync?.last_sync_at,
        syncDirection: googleSync?.sync_direction
      }
    })

  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    )
  }
}