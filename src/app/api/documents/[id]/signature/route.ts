import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ESignatureStatus } from "@prisma/client"

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
    const { e_signature_status } = body

    if (!e_signature_status || !Object.values(ESignatureStatus).includes(e_signature_status)) {
      return NextResponse.json({ error: "Invalid signature status" }, { status: 400 })
    }

    const document = await db.document.update({
      where: { id: params.id },
      data: { e_signature_status },
      include: {
        uploaded_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        associated_deal: {
          select: {
            id: true,
            deal_name: true,
          },
        },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Failed to update document signature status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}