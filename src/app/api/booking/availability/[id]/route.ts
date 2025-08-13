import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const availability = await db.bookingAvailability.findFirst({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      },
      include: {
        availability_rules: true,
        bookings: {
          orderBy: { start_time: "desc" }
        }
      }
    })

    if (!availability) {
      return NextResponse.json({ error: "Availability not found" }, { status: 404 })
    }

    return NextResponse.json(availability)
  } catch (error) {
    console.error("Error fetching booking availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, duration_minutes, buffer_minutes, timezone, rules, is_active } = body

    // First, delete existing rules
    await db.availabilityRule.deleteMany({
      where: { availability_id: params.id }
    })

    // Update availability with new rules
    const availability = await db.bookingAvailability.update({
      where: { id: params.id },
      data: {
        name,
        description,
        duration_minutes,
        buffer_minutes,
        timezone,
        is_active: is_active !== undefined ? is_active : undefined,
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

    return NextResponse.json(availability)
  } catch (error) {
    console.error("Error updating booking availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { is_active } = body

    const availability = await db.bookingAvailability.update({
      where: { id: params.id },
      data: { is_active },
      include: {
        availability_rules: true,
        bookings: true
      }
    })

    return NextResponse.json(availability)
  } catch (error) {
    console.error("Error patching booking availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete associated rules and bookings first
    await db.availabilityRule.deleteMany({
      where: { availability_id: params.id }
    })

    await db.booking.deleteMany({
      where: { availability_id: params.id }
    })

    await db.bookingAvailability.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting booking availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}