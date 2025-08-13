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

    const deals = await db.deal.findMany({
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
      orderBy: {
        created_at: "desc",
      },
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error("Failed to fetch deals:", error)
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
    const { deal_name, stage, associated_contact_id, associated_company_id, owner_user_id } = body

    if (!deal_name || !stage || !associated_contact_id || !owner_user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const deal = await db.deal.create({
      data: {
        deal_name,
        stage,
        associated_contact_id,
        associated_company_id: associated_company_id || null,
        owner_user_id,
        kyc_status: "PENDING",
      },
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

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error("Failed to create deal:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}