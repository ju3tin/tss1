import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contacts = await db.contact.findMany({
      include: {
        associated_company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, email, phone_number, investor_type, source, associated_company_id } = body

    if (!full_name || !email || !investor_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if contact already exists
    const existingContact = await db.contact.findUnique({
      where: { email }
    })

    if (existingContact) {
      return NextResponse.json({ error: "Contact with this email already exists" }, { status: 400 })
    }

    const contact = await db.contact.create({
      data: {
        full_name,
        email,
        phone_number: phone_number || null,
        investor_type,
        source: source || null,
        associated_company_id: associated_company_id || null,
      },
      include: {
        associated_company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error("Failed to create contact:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}