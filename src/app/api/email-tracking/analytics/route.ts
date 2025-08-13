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
    const dealId = searchParams.get('dealId')
    const contactId = searchParams.get('contactId')
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let whereClause = {
      sent_at: {
        gte: startDate
      }
    }
    
    if (dealId) {
      whereClause = { ...whereClause, associated_deal_id: dealId }
    } else if (contactId) {
      whereClause = { ...whereClause, associated_contact_id: contactId }
    }

    // Get basic statistics
    const totalEmails = await db.emailTracking.count({
      where: whereClause
    })

    const openedEmails = await db.emailTracking.count({
      where: {
        ...whereClause,
        opened_at: {
          not: null
        }
      }
    })

    // Get total opens (including multiple opens by same recipient)
    const totalOpens = await db.emailTracking.aggregate({
      where: whereClause,
      _sum: {
        open_count: true
      }
    })

    // Get open rate by device type
    const deviceStats = await db.emailTracking.groupBy({
      by: ['device_type'],
      where: {
        ...whereClause,
        opened_at: {
          not: null
        }
      },
      _count: {
        id: true
      },
      _sum: {
        open_count: true
      }
    })

    // Get open rate by location
    const locationStats = await db.emailTracking.groupBy({
      by: ['location'],
      where: {
        ...whereClause,
        opened_at: {
          not: null
        }
      },
      _count: {
        id: true
      },
      _sum: {
        open_count: true
      }
    })

    // Get daily open statistics
    const dailyStats = await db.emailTracking.groupBy({
      by: ['sent_at'],
      where: whereClause,
      _count: {
        id: true
      },
      _sum: {
        open_count: true
      },
      orderBy: {
        sent_at: 'asc'
      }
    })

    // Get top performing emails (most opens)
    const topEmails = await db.emailTracking.findMany({
      where: whereClause,
      orderBy: {
        open_count: 'desc'
      },
      take: 10,
      include: {
        associated_deal: {
          select: {
            id: true,
            deal_name: true
          }
        },
        associated_contact: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    })

    // Calculate engagement metrics
    const openRate = totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0
    const avgOpensPerEmail = openedEmails > 0 ? (totalOpens._sum.open_count || 0) / openedEmails : 0

    // Get time-based analytics (opens by hour of day)
    const hourlyOpens = await db.emailTracking.findMany({
      where: {
        ...whereClause,
        opened_at: {
          not: null
        }
      },
      select: {
        opened_at: true,
        open_count: true
      }
    })

    // Process hourly data
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      opens: 0
    }))

    hourlyOpens.forEach(email => {
      if (email.opened_at) {
        const hour = new Date(email.opened_at).getHours()
        hourlyStats[hour].opens += email.open_count || 1
      }
    })

    return NextResponse.json({
      summary: {
        total_emails: totalEmails,
        opened_emails: openedEmails,
        total_opens: totalOpens._sum.open_count || 0,
        open_rate: Math.round(openRate * 100) / 100,
        avg_opens_per_email: Math.round(avgOpensPerEmail * 100) / 100
      },
      device_stats: deviceStats.map(stat => ({
        device_type: stat.device_type || 'Unknown',
        emails_opened: stat._count.id,
        total_opens: stat._sum.open_count || 0
      })),
      location_stats: locationStats.map(stat => ({
        location: stat.location || 'Unknown',
        emails_opened: stat._count.id,
        total_opens: stat._sum.open_count || 0
      })),
      hourly_stats: hourlyStats,
      top_emails: topEmails.map(email => ({
        id: email.id,
        subject: email.subject,
        recipient_email: email.recipient_email,
        open_count: email.open_count,
        opened_at: email.opened_at,
        deal: email.associated_deal,
        contact: email.associated_contact
      })),
      period: {
        start_date: startDate,
        end_date: new Date(),
        days: days
      }
    })

  } catch (error) {
    console.error("Error generating email tracking analytics:", error)
    return NextResponse.json(
      { error: "Failed to generate email tracking analytics" },
      { status: 500 }
    )
  }
}