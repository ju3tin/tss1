import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import * as fs from "fs"

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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const dealId = formData.get("dealId") as string
    const documentType = formData.get("documentType") as string
    const documentTemplateId = formData.get("documentTemplateId") as string

    if (!file || !dealId || !documentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify deal exists and user has access
    const deal = await db.deal.findFirst({
      where: { 
        id: dealId,
        OR: [
          { owner_user_id: user.id },
          { associated_contact_id: user.id }
        ]
      }
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found or access denied" }, { status: 404 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "uploads", "documents")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const uniqueFileName = `${uuidv4()}${fileExtension}`
    const filePath = path.join(uploadDir, uniqueFileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record in database
    const document = await db.document.create({
      data: {
        file_name: file.name,
        storage_path: filePath,
        file_type: documentType as any,
        uploaded_by_user_id: user.id,
        associated_deal_id: dealId,
        document_template_id: documentTemplateId || null,
        workflow_status: "PENDING",
        acknowledgment_required: documentType === "AML" || documentType === "KYC",
        auto_extracted: false
      }
    })

    // Create initial workflow step
    await db.documentWorkflowStep.create({
      data: {
        document_id: document.id,
        step_type: "UPLOAD",
        status: "COMPLETED",
        completed_at: new Date(),
        completed_by: user.id,
        notes: `Document uploaded by ${user.first_name} ${user.last_name}`
      }
    })

    // If it's AML or KYC, create extraction workflow step
    if (documentType === "AML" || documentType === "KYC") {
      await db.documentWorkflowStep.create({
        data: {
          document_id: document.id,
          step_type: "EXTRACTION",
          status: "PENDING",
          notes: "Waiting for form field extraction"
        }
      })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        file_name: document.file_name,
        file_type: document.file_type,
        workflow_status: document.workflow_status,
        created_at: document.created_at
      }
    })

  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    )
  }
}