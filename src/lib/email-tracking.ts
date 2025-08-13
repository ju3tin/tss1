import { db } from "@/lib/db"

export interface EmailTrackingData {
  recipient_email: string
  subject: string
  associated_deal_id?: string
  associated_contact_id?: string
}

export interface TrackedEmailResult {
  email_id: string
  tracking_pixel_url: string
  tracking_pixel_html: string
  email_tracking: any
}

/**
 * Create email tracking record and return tracking information
 */
export async function createEmailTracking(data: EmailTrackingData): Promise<TrackedEmailResult> {
  try {
    // Generate unique email ID for tracking
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate tracking pixel URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const trackingPixelUrl = `${baseUrl}/api/tracking/pixel/${emailId}`

    const emailTracking = await db.emailTracking.create({
      data: {
        email_id: emailId,
        recipient_email: data.recipient_email,
        subject: data.subject,
        tracking_pixel_url: trackingPixelUrl,
        associated_deal_id: data.associated_deal_id,
        associated_contact_id: data.associated_contact_id,
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

    const trackingPixelHtml = `<img src="${trackingPixelUrl}" width="1" height="1" border="0" style="display:none;" />`

    return {
      email_id: emailId,
      tracking_pixel_url: trackingPixelUrl,
      tracking_pixel_html: trackingPixelHtml,
      email_tracking: emailTracking
    }
  } catch (error) {
    console.error("Failed to create email tracking:", error)
    throw new Error("Failed to create email tracking record")
  }
}

/**
 * Add tracking pixel to email body
 */
export function addTrackingToEmailBody(emailBody: string, trackingPixelHtml: string): string {
  return emailBody + '\n\n' + trackingPixelHtml
}

/**
 * Get email tracking statistics for a contact
 */
export async function getContactEmailTrackingStats(contactId: string) {
  try {
    const stats = await db.emailTracking.groupBy({
      by: ['opened_at'],
      where: {
        associated_contact_id: contactId
      },
      _count: {
        id: true
      },
      _sum: {
        open_count: true
      }
    })

    const totalEmails = await db.emailTracking.count({
      where: {
        associated_contact_id: contactId
      }
    })

    const openedEmails = await db.emailTracking.count({
      where: {
        associated_contact_id: contactId,
        opened_at: {
          not: null
        }
      }
    })

    const totalOpens = await db.emailTracking.aggregate({
      where: {
        associated_contact_id: contactId
      },
      _sum: {
        open_count: true
      }
    })

    const recentTracking = await db.emailTracking.findMany({
      where: {
        associated_contact_id: contactId
      },
      orderBy: {
        sent_at: 'desc'
      },
      take: 10,
      include: {
        associated_deal: {
          select: {
            id: true,
            deal_name: true,
            stage: true
          }
        }
      }
    })

    return {
      total_emails: totalEmails,
      opened_emails: openedEmails,
      total_opens: totalOpens._sum.open_count || 0,
      open_rate: totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0,
      avg_opens_per_email: openedEmails > 0 ? (totalOpens._sum.open_count || 0) / openedEmails : 0,
      recent_activity: recentTracking
    }
  } catch (error) {
    console.error("Failed to get contact email tracking stats:", error)
    return {
      total_emails: 0,
      opened_emails: 0,
      total_opens: 0,
      open_rate: 0,
      avg_opens_per_email: 0,
      recent_activity: []
    }
  }
}

/**
 * Get email tracking statistics for a deal
 */
export async function getDealEmailTrackingStats(dealId: string) {
  try {
    const totalEmails = await db.emailTracking.count({
      where: {
        associated_deal_id: dealId
      }
    })

    const openedEmails = await db.emailTracking.count({
      where: {
        associated_deal_id: dealId,
        opened_at: {
          not: null
        }
      }
    })

    const totalOpens = await db.emailTracking.aggregate({
      where: {
        associated_deal_id: dealId
      },
      _sum: {
        open_count: true
      }
    })

    const recentTracking = await db.emailTracking.findMany({
      where: {
        associated_deal_id: dealId
      },
      orderBy: {
        sent_at: 'desc'
      },
      take: 10,
      include: {
        associated_contact: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    })

    return {
      total_emails: totalEmails,
      opened_emails: openedEmails,
      total_opens: totalOpens._sum.open_count || 0,
      open_rate: totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0,
      avg_opens_per_email: openedEmails > 0 ? (totalOpens._sum.open_count || 0) / openedEmails : 0,
      recent_activity: recentTracking
    }
  } catch (error) {
    console.error("Failed to get deal email tracking stats:", error)
    return {
      total_emails: 0,
      opened_emails: 0,
      total_opens: 0,
      open_rate: 0,
      avg_opens_per_email: 0,
      recent_activity: []
    }
  }
}