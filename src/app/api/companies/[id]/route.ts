import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, company_type, region, vertical, aum, ticket_size_range, primary_contact_id } = body

    const updateData: any = {
      name,
      company_type,
      region: region || null,
      vertical: vertical || null,
      aum: aum || null,
      ticket_size_range: ticket_size_range || null,
      primary_contact_id: primary_contact_id || null,
    }

    const company = await db.company.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(company)
  } catch (error) {
    console.error("Failed to update company:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.company.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete company:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}