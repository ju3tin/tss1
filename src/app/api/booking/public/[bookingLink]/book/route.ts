import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendBookingConfirmationEmail } from "@/lib/booking-emails"

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingLink: string } }
) {
  try {
    const availability = await db.bookingAvailability.findFirst({
      where: {
        booking_link: params.bookingLink,
        is_active: true
      }
    })

    if (!availability) {
      return NextResponse.json({ error: "Availability not found" }, { status: 404 })
    }

    const body = await request.json()
    const { guest_name, guest_email, guest_phone, start_time, end_time, notes } = body

    if (!guest_name || !guest_email || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if the time slot is still available
    const existingBooking = await db.booking.findFirst({
      where: {
        availability_id: availability.id,
        OR: [
          {
            AND: [
              { start_time: { lte: start_time } },
              { end_time: { gt: start_time } }
            ]
          },
          {
            AND: [
              { start_time: { lt: end_time } },
              { end_time: { gte: end_time } }
            ]
          }
        ],
        status: {
          in: ["PENDING", "CONFIRMED"]
        }
      }
    })

    if (existingBooking) {
      return NextResponse.json({ error: "Time slot already booked" }, { status: 409 })
    }

    // Try to find existing contact by email
    let contact = await db.contact.findUnique({
      where: { email: guest_email }
    })

    // If no contact exists, create one
    if (!contact) {
      contact = await db.contact.create({
        data: {
          full_name: guest_name,
          email: guest_email,
          phone_number: guest_phone,
          investor_type: "INDIVIDUAL" // Default value
        }
      })
    }

    // Create the booking
    const booking = await db.booking.create({
      data: {
        availability_id: availability.id,
        contact_id: contact.id,
        guest_name,
        guest_email,
        guest_phone,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        status: "CONFIRMED", // Auto-confirm bookings
        timezone: availability.timezone,
        notes
      },
      include: {
        availability: {
          include: {
            user: true
          }
        },
        contact: true
      }
    })

    // Send confirmation emails
    try {
      await sendBookingConfirmationEmail({
        booking: {
          ...booking,
          start_time: booking.start_time,
          end_time: booking.end_time
        },
        availability: booking.availability,
        contact: booking.contact
      })
    } catch (emailError) {
      console.error("Failed to send confirmation emails:", emailError)
      // Don't fail the booking if emails fail
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}