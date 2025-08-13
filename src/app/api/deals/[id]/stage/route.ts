import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DealStage } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { stage } = body

    if (!stage || !Object.values(DealStage).includes(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 })
    }

    const deal = await db.deal.update({
      where: { id: params.id },
      data: { stage },
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
    console.error("Failed to update deal stage:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}