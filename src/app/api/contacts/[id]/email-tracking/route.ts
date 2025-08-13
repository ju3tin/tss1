import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getContactEmailTrackingStats } from "@/lib/email-tracking"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contactId = params.id

    // Verify contact exists
    const contact = await db.contact.findUnique({
      where: { id: contactId }
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    // Get email tracking statistics for this contact
    const stats = await getContactEmailTrackingStats(contactId)

    return NextResponse.json(stats)

  } catch (error) {
    console.error("Error fetching contact email tracking:", error)
    return NextResponse.json(
      { error: "Failed to fetch contact email tracking" },
      { status: 500 }
    )
  }
}