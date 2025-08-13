import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

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

    const { documentId, signatureData, signatureType, signerName, signerEmail } = await request.json()

    if (!documentId || !signatureData || !signatureType || !signerName || !signerEmail) {
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

    // Create signature record
    const signature = await db.documentSignature.create({
      data: {
        document_id: documentId,
        signer_email: signerEmail,
        signer_name: signerName,
        signature_data: signatureData,
        signature_type: signatureType as any,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
        status: "SIGNED",
        verification_token: uuidv4()
      }
    })

    // Update document signature status
    await db.document.update({
      where: { id: documentId },
      data: {
        signature_data: signatureData,
        signed_at: new Date(),
        e_signature_status: "SIGNED",
        workflow_status: "SIGNED"
      }
    })

    // Update workflow step
    await db.documentWorkflowStep.updateMany({
      where: {
        document_id: documentId,
        step_type: "SIGNATURE",
        status: "PENDING"
      },
      data: {
        status: "COMPLETED",
        completed_at: new Date(),
        completed_by: user.id,
        notes: `Document signed by ${signerName} (${signerEmail})`
      }
    })

    // Create completion workflow step
    await db.documentWorkflowStep.create({
      data: {
        document_id: documentId,
        step_type: "COMPLETION",
        status: "COMPLETED",
        completed_at: new Date(),
        completed_by: user.id,
        notes: "Document signing process completed"
      }
    })

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        signer_name: signature.signer_name,
        signer_email: signature.signer_email,
        signed_at: signature.signed_at,
        status: signature.status
      },
      document: {
        id: document.id,
        workflow_status: "SIGNED",
        e_signature_status: "SIGNED",
        signed_at: new Date()
      }
    })

  } catch (error) {
    console.error("Document signing error:", error)
    return NextResponse.json(
      { error: "Failed to sign document" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    // Find signature by verification token
    const signature = await db.documentSignature.findUnique({
      where: { verification_token: token },
      include: {
        document: {
          include: {
            associated_deal: {
              include: {
                associated_contact: true
              }
            }
          }
        }
      }
    })

    if (!signature) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 404 })
    }

    // Mark signature as verified
    await db.documentSignature.update({
      where: { id: signature.id },
      data: {
        status: "VERIFIED",
        verified_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        signer_name: signature.signer_name,
        signer_email: signature.signer_email,
        signed_at: signature.signed_at,
        verified_at: new Date(),
        status: "VERIFIED"
      },
      document: {
        id: signature.document.id,
        file_name: signature.document.file_name,
        file_type: signature.document.file_type
      }
    })

  } catch (error) {
    console.error("Signature verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify signature" },
      { status: 500 }
    )
  }
}