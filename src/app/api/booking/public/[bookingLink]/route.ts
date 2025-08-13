import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingLink: string }> }
) {
  try {
    const { bookingLink } = await params
    const availability = await db.bookingAvailability.findFirst({
      where: {
        booking_link: bookingLink,
        is_active: true
      },
      include: {
        availability_rules: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    })

    if (!availability) {
      return NextResponse.json({ error: "Availability not found" }, { status: 404 })
    }

    return NextResponse.json(availability)
  } catch (error) {
    console.error("Error fetching public booking availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}