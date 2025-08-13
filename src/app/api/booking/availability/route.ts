import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        booking_availabilities: {
          include: {
            availability_rules: true,
            bookings: {
              orderBy: { start_time: "desc" },
              take: 10
            }
          },
          orderBy: { created_at: "desc" }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user.booking_availabilities)
  } catch (error) {
    console.error("Error fetching booking availabilities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    console.log("Received booking data:", body)
    
    const { name, description, duration_minutes, buffer_minutes, timezone, rules } = body

    if (!name || !duration_minutes || !buffer_minutes || !timezone || !rules) {
      console.log("Missing required fields:", { name, duration_minutes, buffer_minutes, timezone, rules })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const bookingLink = nanoid(10)
    console.log("Creating booking availability with link:", bookingLink)

    const availability = await db.bookingAvailability.create({
      data: {
        user_id: user.id,
        name,
        description,
        duration_minutes,
        buffer_minutes,
        booking_link: bookingLink,
        timezone,
        availability_rules: {
          create: rules.map((rule: any) => ({
            day_of_week: rule.day_of_week,
            start_time: rule.start_time,
            end_time: rule.end_time,
            is_available: rule.is_available
          }))
        }
      },
      include: {
        availability_rules: true,
        bookings: true
      }
    })

    console.log("Created availability:", availability)
    return NextResponse.json(availability)
  } catch (error) {
    console.error("Error creating booking availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}