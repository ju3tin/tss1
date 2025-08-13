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

    const companies = await db.company.findMany({
      include: {
        primary_contact: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error("Failed to fetch companies:", error)
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
    const { name, company_type, region, vertical, aum, ticket_size_range, primary_contact_id } = body

    if (!name || !company_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if company already exists
    const existingCompany = await db.company.findUnique({
      where: { name }
    })

    if (existingCompany) {
      return NextResponse.json({ error: "Company with this name already exists" }, { status: 400 })
    }

    const company = await db.company.create({
      data: {
        name,
        company_type,
        region: region || null,
        vertical: vertical || null,
        aum: aum || null,
        ticket_size_range: ticket_size_range || null,
        primary_contact_id: primary_contact_id || null,
      },
      include: {
        primary_contact: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error("Failed to create company:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}