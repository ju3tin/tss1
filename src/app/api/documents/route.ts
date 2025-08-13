import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get("dealId")
    const documentType = searchParams.get("documentType")
    const status = searchParams.get("status")

    const whereClause: any = {
      associated_deal: {
        OR: [
          { owner_user_id: user.id },
          { associated_contact_id: user.id }
        ]
      }
    }

    if (dealId) {
      whereClause.associated_deal_id = dealId
    }

    if (documentType) {
      whereClause.file_type = documentType
    }

    if (status) {
      whereClause.workflow_status = status
    }

    const documents = await db.document.findMany({
      where: whereClause,
      include: {
        uploaded_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        associated_deal: {
          select: {
            id: true,
            deal_name: true,
            stage: true,
            associated_contact: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          }
        },
        document_workflow_steps: {
          orderBy: {
            created_at: "desc"
          },
          take: 1
        },
        document_signatures: {
          orderBy: {
            created_at: "desc"
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    })

    return NextResponse.json({ documents })

  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}