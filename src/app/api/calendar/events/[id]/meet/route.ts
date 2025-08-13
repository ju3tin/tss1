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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id

    // Check if event exists and belongs to current user
    const event = await db.calendarEvent.findFirst({
      where: {
        id: eventId,
        user_id: session.user.id
      }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Generate Google Meet link
    const meetLink = `https://meet.google.com/${generateMeetId()}`
    const googleMeetData = JSON.stringify({
      meetId: generateMeetId(),
      created: new Date().toISOString(),
      type: "google_meet"
    })

    // Update event with Google Meet link
    const updatedEvent = await db.calendarEvent.update({
      where: { id: eventId },
      data: {
        google_meet_link: meetLink,
        google_meet_data: googleMeetData,
        include_google_meet: true,
        updated_at: new Date()
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

    return NextResponse.json({
      message: "Google Meet link generated successfully",
      event: updatedEvent,
      meet_link: meetLink
    })

  } catch (error) {
    console.error("Error generating Google Meet link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}