import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const documentId = params.id

    // Verify document access
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

    // Get workflow steps
    const workflowSteps = await db.documentWorkflowStep.findMany({
      where: { document_id: documentId },
      orderBy: { created_at: "asc" }
    })

    return NextResponse.json({
      workflowSteps,
      document: {
        id: document.id,
        workflow_status: document.workflow_status,
        validation_status: document.validation_status
      }
    })

  } catch (error) {
    console.error("Error fetching workflow steps:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflow steps" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const documentId = params.id
    const { stepType, notes } = await request.json()

    if (!stepType) {
      return NextResponse.json({ error: "Step type is required" }, { status: 400 })
    }

    // Verify document access
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

    // Create new workflow step
    const workflowStep = await db.documentWorkflowStep.create({
      data: {
        document_id: documentId,
        step_type: stepType,
        status: "PENDING",
        notes: notes || `Created ${stepType.toLowerCase()} step`
      }
    })

    return NextResponse.json({
      success: true,
      workflowStep: {
        id: workflowStep.id,
        step_type: workflowStep.step_type,
        status: workflowStep.status,
        created_at: workflowStep.created_at
      }
    })

  } catch (error) {
    console.error("Error creating workflow step:", error)
    return NextResponse.json(
      { error: "Failed to create workflow step" },
      { status: 500 }
    )
  }
}