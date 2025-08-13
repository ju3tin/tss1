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

    let whereClause = {}
    
    if (dealId) {
      whereClause = { associated_deal_id: dealId }
    } else if (contactId) {
      whereClause = { associated_contact_id: contactId }
    }

    const emailTrackings = await db.emailTracking.findMany({
      where: whereClause,
      include: {
        associated_deal: {
          select: {
            id: true,
            deal_name: true,
            stage: true
          }
        },
        associated_contact: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        sent_at: 'desc'
      }
    })

    return NextResponse.json(emailTrackings)

  } catch (error) {
    console.error("Error fetching email tracking:", error)
    return NextResponse.json(
      { error: "Failed to fetch email tracking data" },
      { status: 500 }
    )
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
      recipient_email,
      subject,
      associated_deal_id,
      associated_contact_id
    } = body

    if (!recipient_email || !subject) {
      return NextResponse.json(
        { error: "Recipient email and subject are required" },
        { status: 400 }
      )
    }

    // Generate unique email ID for tracking
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate tracking pixel URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const trackingPixelUrl = `${baseUrl}/api/tracking/pixel/${emailId}`

    const emailTracking = await db.emailTracking.create({
      data: {
        email_id: emailId,
        recipient_email,
        subject,
        tracking_pixel_url: trackingPixelUrl,
        associated_deal_id,
        associated_contact_id,
        sent_at: new Date()
      },
      include: {
        associated_deal: {
          select: {
            id: true,
            deal_name: true,
            stage: true
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

    return NextResponse.json({
      message: "Email tracking record created successfully",
      email_tracking: emailTracking,
      tracking_pixel_url: trackingPixelUrl,
      tracking_pixel_html: `<img src="${trackingPixelUrl}" width="1" height="1" border="0" style="display:none;" />`
    })

  } catch (error) {
    console.error("Error creating email tracking:", error)
    return NextResponse.json(
      { error: "Failed to create email tracking record" },
      { status: 500 }
    )
  }
}