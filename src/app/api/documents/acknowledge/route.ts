import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
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

    const { documentId, acknowledgedBy, acknowledgmentText } = await request.json()

    if (!documentId || !acknowledgedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get document and verify access
    const document = await db.document.findFirst({
      where: { 
        id: documentId,
        associated_deal: {
          OR: [
            { owner_user_id: user.id },
            { associated_contact_id: user.id }
          ]
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    // Update document acknowledgment
    await db.document.update({
      where: { id: documentId },
      data: {
        acknowledged_at: new Date(),
        acknowledged_by: acknowledgedBy,
        workflow_status: document.acknowledgment_required ? "ACKNOWLEDGED" : document.workflow_status
      }
    })

    // Update workflow step
    await db.documentWorkflowStep.updateMany({
      where: {
        document_id: documentId,
        step_type: "ACKNOWLEDGMENT",
        status: "PENDING"
      },
      data: {
        status: "COMPLETED",
        completed_at: new Date(),
        completed_by: user.id,
        notes: `Document acknowledged by ${acknowledgedBy}${acknowledgmentText ? ': ' + acknowledgmentText : ''}`
      }
    })

    // If acknowledgment is required and document is ready for signature, create signature step
    if (document.acknowledgment_required && document.workflow_status === "READY_FOR_SIGNATURE") {
      await db.documentWorkflowStep.create({
        data: {
          document_id: documentId,
          step_type: "SIGNATURE",
          status: "PENDING",
          notes: "Document ready for signature"
        }
      })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        workflow_status: document.acknowledgment_required ? "ACKNOWLEDGED" : document.workflow_status,
        acknowledged_at: new Date(),
        acknowledged_by: acknowledgedBy
      }
    })

  } catch (error) {
    console.error("Document acknowledgment error:", error)
    return NextResponse.json(
      { error: "Failed to acknowledge document" },
      { status: 500 }
    )
  }
}