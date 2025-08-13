import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import ZAI from "z-ai-web-dev-sdk"
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

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
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
      },
      include: {
        associated_deal: {
          include: {
            associated_contact: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    // Update workflow step to processing
    await db.documentWorkflowStep.updateMany({
      where: {
        document_id: documentId,
        step_type: "EXTRACTION",
        status: "PENDING"
      },
      data: {
        status: "PROCESSING",
        notes: "Starting form field extraction..."
      }
    })

    // Read file content
    const fileContent = fs.readFileSync(document.storage_path, "base64")

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create extraction prompt based on document type
    let extractionPrompt = ""
    if (document.file_type === "AML") {
      extractionPrompt = `Extract all form fields from this AML (Anti-Money Laundering) document. Please identify and extract:
      - Full name
      - Date of birth
      - Address
      - Nationality
      - Occupation
      - Source of funds
      - Political exposure status
      - Risk assessment
      - Any other relevant fields
      
      Return the data in JSON format with field names as keys.`
    } else if (document.file_type === "KYC") {
      extractionPrompt = `Extract all form fields from this KYC (Know Your Customer) document. Please identify and extract:
      - Full name
      - Date of birth
      - Contact information
      - Identification details
      - Financial information
      - Investment experience
      - Risk tolerance
      - Declaration statements
      - Signature details
      - Any other relevant fields
      
      Return the data in JSON format with field names as keys.`
    } else {
      extractionPrompt = `Extract all form fields and relevant information from this document. Return the data in JSON format with field names as keys.`
    }

    try {
      // Use ZAI to extract form fields
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert document analysis assistant. Extract form fields accurately and return them in JSON format."
          },
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const extractedData = completion.choices[0]?.message?.content

      if (extractedData) {
        // Update document with extracted data
        await db.document.update({
          where: { id: documentId },
          data: {
            extracted_data: extractedData,
            auto_extracted: true,
            workflow_status: "READY_FOR_REVIEW",
            validation_status: "REQUIRES_REVIEW"
          }
        })

        // Update workflow step to completed
        await db.documentWorkflowStep.updateMany({
          where: {
            document_id: documentId,
            step_type: "EXTRACTION",
            status: "PROCESSING"
          },
          data: {
            status: "COMPLETED",
            completed_at: new Date(),
            completed_by: user.id,
            notes: "Form fields extracted successfully using AI"
          }
        })

        // Create review workflow step
        await db.documentWorkflowStep.create({
          data: {
            document_id: documentId,
            step_type: "REVIEW",
            status: "PENDING",
            notes: "Document ready for human review"
          }
        })

        return NextResponse.json({
          success: true,
          extractedData: JSON.parse(extractedData),
          document: {
            id: document.id,
            workflow_status: "READY_FOR_REVIEW",
            validation_status: "REQUIRES_REVIEW"
          }
        })
      } else {
        throw new Error("No data extracted from document")
      }

    } catch (extractionError) {
      console.error("Extraction error:", extractionError)
      
      // Update workflow step with error
      await db.documentWorkflowStep.updateMany({
        where: {
          document_id: documentId,
          step_type: "EXTRACTION",
          status: "PROCESSING"
        },
        data: {
          status: "REJECTED",
          error_message: "Failed to extract form fields using AI",
          notes: "Extraction failed - manual review required"
        }
      })

      return NextResponse.json({
        success: false,
        error: "Failed to extract form fields",
        document: {
          id: document.id,
          workflow_status: "REJECTED"
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Document extraction error:", error)
    return NextResponse.json(
      { error: "Failed to extract document data" },
      { status: 500 }
    )
  }
}