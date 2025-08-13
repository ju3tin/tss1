import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DealStage, KYCStatus } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dealId = params.id
    
    // Fetch the deal with current state
    const deal = await db.deal.findUnique({
      where: { id: dealId },
      include: {
        associated_contact: true,
        associated_company: true,
        documents: true,
        tasks: {
          where: {
            status: 'COMPLETED'
          }
        },
        owner: true
      }
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    let newStage = deal.stage
    let progressionReason = ""
    const updates: any = { updated_at: new Date() }

    // Automated progression logic
    switch (deal.stage) {
      case DealStage.NEW_LEAD:
        // Progress to KYC_IN_PROGRESS if initial contact is made
        if (deal.associated_contact.email) {
          newStage = DealStage.KYC_IN_PROGRESS
          progressionReason = "Initial contact established, moving to KYC phase"
          updates.kyc_status = KYCStatus.PENDING
        }
        break

      case DealStage.KYC_IN_PROGRESS:
        // Progress to DUE_DILIGENCE if KYC is verified and documents are archived
        if (deal.kyc_status === KYCStatus.VERIFIED && deal.documents.length > 0) {
          newStage = DealStage.DUE_DILIGENCE
          progressionReason = "KYC verified and documents archived, moving to due diligence"
        }
        break

      case DealStage.DUE_DILIGENCE:
        // Progress to CONTRACT_SIGNING if due diligence is complete
        const dueDiligenceCompleted = deal.tasks.some(task => 
          task.title.includes("Due Diligence") && task.status === 'COMPLETED'
        )
        if (dueDiligenceCompleted) {
          newStage = DealStage.CONTRACT_SIGNING
          progressionReason = "Due diligence completed, moving to contract signing"
        }
        break

      case DealStage.CONTRACT_SIGNING:
        // Progress to ONBOARDED if contract is signed
        const contractSigned = deal.documents.some(doc => 
          doc.file_type === 'CONTRACT' && doc.e_signature_status === 'SIGNED'
        )
        if (contractSigned) {
          newStage = DealStage.ONBOARDED
          progressionReason = "Contract signed, deal onboarded successfully"
        }
        break

      case DealStage.ONBOARDED:
      case DealStage.REJECTED:
        // No further progression needed
        break
    }

    // Only update if stage has changed
    if (newStage !== deal.stage) {
      updates.stage = newStage

      const updatedDeal = await db.deal.update({
        where: { id: dealId },
        data: updates,
        include: {
          associated_contact: true,
          associated_company: true,
          documents: true,
          tasks: true,
          owner: true
        }
      })

      // Create a task for the new stage
      let taskTitle = ""
      let taskDescription = ""
      let dueDate = new Date()

      switch (newStage) {
        case DealStage.KYC_IN_PROGRESS:
          taskTitle = `Send KYC Request - ${deal.deal_name}`
          taskDescription = `Send KYC/AML requirements to ${deal.associated_contact.full_name}`
          dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
          break
        case DealStage.DUE_DILIGENCE:
          taskTitle = `Due Diligence Review - ${deal.deal_name}`
          taskDescription = `Review KYC documents and perform due diligence for ${deal.associated_contact.full_name}`
          dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
          break
        case DealStage.CONTRACT_SIGNING:
          taskTitle = `Prepare Contract - ${deal.deal_name}`
          taskDescription = `Prepare and send contract for ${deal.deal_name} to ${deal.associated_contact.full_name}`
          dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          break
        case DealStage.ONBOARDED:
          taskTitle = `Onboarding Complete - ${deal.deal_name}`
          taskDescription = `Complete onboarding process for ${deal.associated_contact.full_name}`
          dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
          break
      }

      if (taskTitle) {
        await db.task.create({
          data: {
            title: taskTitle,
            description: taskDescription,
            due_date: dueDate,
            status: 'PENDING',
            assigned_to_user_id: deal.owner_user_id,
            parent_document_id: deal.id,
            parent_document_type: 'DEAL',
            associated_deal_id: deal.id
          }
        })
      }

      return NextResponse.json({ 
        message: "Deal progressed successfully",
        deal: updatedDeal,
        progressionReason,
        previousStage: deal.stage,
        newStage
      })
    } else {
      return NextResponse.json({ 
        message: "No progression needed",
        deal,
        reason: "Deal does not meet criteria for next stage"
      })
    }

  } catch (error) {
    console.error("Error in auto progression:", error)
    return NextResponse.json(
      { error: "Failed to progress deal automatically" },
      { status: 500 }
    )
  }
}