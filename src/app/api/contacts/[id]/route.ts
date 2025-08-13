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
    const { full_name, email, phone_number, investor_type, source, associated_company_id } = body

    const updateData: any = {
      full_name,
      email,
      phone_number: phone_number || null,
      investor_type,
      source: source || null,
      associated_company_id: associated_company_id || null,
    }

    const contact = await db.contact.update({
      where: { id: params.id },
      data: updateData,
      include: {
        associated_company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Failed to update contact:", error)
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

    await db.contact.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete contact:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}