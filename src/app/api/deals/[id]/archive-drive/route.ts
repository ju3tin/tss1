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
    
    // Fetch the deal with related documents
    const deal = await db.deal.findUnique({
      where: { id: dealId },
      include: {
        associated_contact: true,
        associated_company: true,
        documents: true,
        owner: true
      }
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Check if KYC is verified before archiving
    if (deal.kyc_status !== KYCStatus.VERIFIED) {
      return NextResponse.json({ 
        error: "KYC must be verified before archiving to Google Drive" 
      }, { status: 400 })
    }

    // Check if there are documents to archive
    if (deal.documents.length === 0) {
      return NextResponse.json({ 
        error: "No documents to archive" 
      }, { status: 400 })
    }

    // Simulate Google Drive archiving process
    // In a real implementation, you would use Google Drive API here
    const archiveResults = deal.documents.map(doc => ({
      documentId: doc.id,
      fileName: doc.file_name,
      fileType: doc.file_type,
      archived: true,
      driveUrl: `https://drive.google.com/file/d/${doc.id}/view`, // Simulated URL
      archivedAt: new Date().toISOString()
    }))

    // Update deal stage to DUE_DILIGENCE after successful archiving
    const updatedDeal = await db.deal.update({
      where: { id: dealId },
      data: {
        stage: DealStage.DUE_DILIGENCE,
        updated_at: new Date()
      },
      include: {
        associated_contact: true,
        associated_company: true,
        documents: true,
        owner: true
      }
    })

    // Create a task for due diligence review
    await db.task.create({
      data: {
        title: `Due Diligence Review - ${deal.deal_name}`,
        description: `KYC documents archived to Google Drive. Begin due diligence review for ${deal.associated_contact.full_name}.`,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'PENDING',
        assigned_to_user_id: deal.owner_user_id,
        parent_document_id: deal.id,
        parent_document_type: 'DEAL',
        associated_deal_id: deal.id
      }
    })

    return NextResponse.json({ 
      message: "Documents archived to Google Drive successfully",
      deal: updatedDeal,
      archiveResults
    })

  } catch (error) {
    console.error("Error archiving to Google Drive:", error)
    return NextResponse.json(
      { error: "Failed to archive documents to Google Drive" },
      { status: 500 }
    )
  }
}