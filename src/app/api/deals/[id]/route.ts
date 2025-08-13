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
    const { deal_name, stage, associated_contact_id, associated_company_id, owner_user_id } = body

    const updateData: any = {
      deal_name,
      stage,
      associated_contact_id,
      associated_company_id: associated_company_id || null,
      owner_user_id,
    }

    const deal = await db.deal.update({
      where: { id: params.id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        associated_contact: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        associated_company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Failed to update deal:", error)
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

    await db.deal.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete deal:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}