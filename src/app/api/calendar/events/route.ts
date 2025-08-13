import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Helper function to generate Google Meet ID
function generateMeetId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    if (i < 2) result += '-'
  }
  return result
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamView = searchParams.get("team") === "true"
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let whereClause: any = {}

    if (teamView) {
      // Show all events for all users
      whereClause = {}
    } else if (userId) {
      // Show events for specific user (team view filtering)
      whereClause = { user_id: userId }
    } else {
      // Show only current user's events
      whereClause = { user_id: session.user.id }
    }

    // Add date filtering if provided
    if (startDate && endDate) {
      whereClause.start_time = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const events = await db.calendarEvent.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: {
        start_time: "asc"
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      start_time,
      end_time,
      location,
      event_type = "MEETING",
      attendees,
      reminder_minutes = 15,
      include_google_meet = false
    } = body

    if (!title || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let googleMeetLink = null
    let googleMeetData = null

    // Generate Google Meet link if requested
    if (include_google_meet) {
      try {
        // Generate a Google Meet link
        const meetLink = `https://meet.google.com/${generateMeetId()}`
        googleMeetLink = meetLink
        googleMeetData = JSON.stringify({
          meetId: generateMeetId(),
          created: new Date().toISOString(),
          type: "google_meet"
        })
      } catch (error) {
        console.error("Failed to generate Google Meet link:", error)
      }
    }

    const event = await db.calendarEvent.create({
      data: {
        user_id: session.user.id,
        title,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        location,
        event_type,
        attendees: attendees ? JSON.stringify(attendees) : null,
        reminder_minutes,
        include_google_meet,
        google_meet_link: googleMeetLink,
        google_meet_data: googleMeetData
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error creating calendar event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}