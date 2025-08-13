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

    const bookings = await db.booking.findMany({
      where: {
        contact_id: params.id,
        availability: {
          user: {
            email: session.user.email
          }
        }
      },
      include: {
        availability: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        start_time: "desc"
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching contact bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}