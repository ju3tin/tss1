import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
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
    const stepId = params.stepId

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

    // Get the workflow step
    const workflowStep = await db.documentWorkflowStep.findUnique({
      where: { id: stepId }
    })

    if (!workflowStep) {
      return NextResponse.json({ error: "Workflow step not found" }, { status: 404 })
    }

    if (workflowStep.document_id !== documentId) {
      return NextResponse.json({ error: "Workflow step does not belong to this document" }, { status: 400 })
    }

    // Only allow retry for rejected steps
    if (workflowStep.status !== "REJECTED") {
      return NextResponse.json({ error: "Only rejected steps can be retried" }, { status: 400 })
    }

    // Update the workflow step to pending
    const updatedStep = await db.documentWorkflowStep.update({
      where: { id: stepId },
      data: {
        status: "PENDING",
        error_message: null,
        notes: `Step retried by ${user.first_name} ${user.last_name} at ${new Date().toLocaleString()}`
      }
    })

    // If this is an extraction step, trigger the extraction process
    if (workflowStep.step_type === "EXTRACTION") {
      try {
        // Trigger extraction in the background
        await fetch("/api/documents/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ documentId })
        })
      } catch (extractionError) {
        console.error("Error triggering extraction:", extractionError)
        // Don't fail the retry if extraction fails
      }
    }

    return NextResponse.json({
      success: true,
      workflowStep: {
        id: updatedStep.id,
        step_type: updatedStep.step_type,
        status: updatedStep.status,
        notes: updatedStep.notes,
        updated_at: updatedStep.updated_at
      }
    })

  } catch (error) {
    console.error("Error retrying workflow step:", error)
    return NextResponse.json(
      { error: "Failed to retry workflow step" },
      { status: 500 }
    )
  }
}