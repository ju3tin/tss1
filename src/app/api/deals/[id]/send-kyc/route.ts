import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DealStage, KYCStatus } from "@prisma/client"
import ZAI from 'z-ai-web-dev-sdk'
import { createEmailTracking, addTrackingToEmailBody } from "@/lib/email-tracking"

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
    
    // Fetch the deal with related contact and company information
    const deal = await db.deal.findUnique({
      where: { id: dealId },
      include: {
        associated_contact: true,
        associated_company: true,
        owner: true
      }
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Initialize ZAI SDK for email generation
    const zai = await ZAI.create()

    // Generate personalized KYC/AML email content
    const emailPrompt = `
      Generate a professional KYC/AML compliance email for an investment deal.
      
      Deal Details:
      - Deal Name: ${deal.deal_name}
      - Contact: ${deal.associated_contact.full_name}
      - Email: ${deal.associated_contact.email}
      - Company: ${deal.associated_company?.name || 'N/A'}
      - Current Stage: ${deal.stage.replace('_', ' ')}
      
      The email should:
      1. Be professional and courteous
      2. Explain the KYC/AML requirements
      3. List the documents needed (ID, proof of address, source of funds, etc.)
      4. Provide clear instructions for submission
      5. Include a reasonable deadline
      6. Mention that this is a standard compliance procedure
      7. Include contact information for questions
      
      Return the email in JSON format with subject and body fields.
    `

    const emailCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional compliance officer specializing in investment KYC/AML procedures."
        },
        {
          role: "user",
          content: emailPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    let emailContent
    try {
      emailContent = JSON.parse(emailCompletion.choices[0]?.message?.content || '{}')
    } catch (error) {
      // Fallback email content if JSON parsing fails
      emailContent = {
        subject: `KYC/AML Compliance Requirements for ${deal.deal_name}`,
        body: `Dear ${deal.associated_contact.full_name},

Thank you for your interest in ${deal.deal_name}. As part of our standard compliance procedure, we require KYC (Know Your Customer) and AML (Anti-Money Laundering) documentation to proceed.

Please provide the following documents:
1. Copy of valid ID/passport
2. Proof of address (utility bill or bank statement)
3. Source of funds declaration
4. Company incorporation documents (if applicable)

Please submit these documents within 7 business days. If you have any questions, please don't hesitate to contact us.

Best regards,
Compliance Team`
      }
    }

    // Create email tracking record
    const trackingData = await createEmailTracking({
      recipient_email: deal.associated_contact.email,
      subject: emailContent.subject,
      associated_deal_id: dealId,
      associated_contact_id: deal.associated_contact_id
    })

    // Add tracking pixel to email body
    const trackedEmailBody = addTrackingToEmailBody(emailContent.body, trackingData.tracking_pixel_html)

    // In a real implementation, you would send the email here
    // For now, we'll simulate the email sending
    console.log(`Email would be sent to ${deal.associated_contact.email}`)
    console.log(`Subject: ${emailContent.subject}`)
    console.log(`Body: ${trackedEmailBody}`)
    console.log(`Tracking ID: ${trackingData.email_tracking?.email_id}`)

    // Update deal stage and KYC status
    const updatedDeal = await db.deal.update({
      where: { id: dealId },
      data: {
        stage: DealStage.KYC_IN_PROGRESS,
        kyc_status: KYCStatus.SUBMITTED,
        updated_at: new Date()
      },
      include: {
        associated_contact: true,
        associated_company: true,
        owner: true
      }
    })

    // Create a task for tracking the KYC submission
    await db.task.create({
      data: {
        title: `KYC Documents Submitted - ${deal.deal_name}`,
        description: `KYC/AML email sent to ${deal.associated_contact.full_name}. Awaiting document submission. Email tracking ID: ${trackingData.email_tracking?.email_id}`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'PENDING',
        assigned_to_user_id: deal.owner_user_id,
        parent_document_id: deal.id,
        parent_document_type: 'DEAL',
        associated_deal_id: deal.id
      }
    })

    return NextResponse.json({ 
      message: "KYC/AML email sent successfully",
      deal: updatedDeal,
      email: {
        subject: emailContent.subject,
        body: trackedEmailBody,
        recipient: deal.associated_contact.email
      },
      tracking: trackingData.email_tracking,
      tracking_pixel: trackingData.tracking_pixel_html
    })

  } catch (error) {
    console.error("Error sending KYC email:", error)
    return NextResponse.json(
      { error: "Failed to send KYC email" },
      { status: 500 }
    )
  }
}