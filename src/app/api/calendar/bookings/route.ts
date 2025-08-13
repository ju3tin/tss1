import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

    let whereClause: any = {
      status: {
        in: ["PENDING", "CONFIRMED"]
      }
    }

    if (teamView) {
      // Show all bookings for all users
      // No additional filtering needed
    } else if (userId) {
      // Show bookings for specific user
      whereClause.availability = {
        user_id: userId
      }
    } else {
      // Show only current user's bookings
      whereClause.availability = {
        user_id: session.user.id
      }
    }

    // Add date filtering if provided
    if (startDate && endDate) {
      whereClause.start_time = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const bookings = await db.booking.findMany({
      where: whereClause,
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
        start_time: "asc"
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching calendar bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}