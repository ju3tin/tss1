import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { InvestorType, CompanyType, DocumentType, DealStage, KYCStatus } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form data
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const investorType = formData.get('investorType') as InvestorType
    const companyName = formData.get('companyName') as string
    const companyType = formData.get('companyType') as CompanyType
    const companyRegion = formData.get('companyRegion') as string
    const companyVertical = formData.get('companyVertical') as string
    const companyAUM = formData.get('companyAUM') as string
    const ticketSizeRange = formData.get('ticketSizeRange') as string
    const dealName = formData.get('dealName') as string
    const dealDescription = formData.get('dealDescription') as string

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !investorType || !dealName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }

    // Create or get contact
    let contact = await db.contact.findUnique({
      where: { email }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          full_name: fullName,
          email,
          phone_number: phoneNumber,
          investor_type: investorType,
        }
      })
    }

    // Create company if applicable
    let company = null
    if (companyName && investorType !== InvestorType.INDIVIDUAL) {
      company = await db.company.create({
        data: {
          name: companyName,
          company_type: companyType,
          region: companyRegion || null,
          vertical: companyVertical || null,
          aum: companyAUM ? parseFloat(companyAUM) : null,
          ticket_size_range: ticketSizeRange || null,
          primary_contact_id: contact.id,
        }
      })

      // Update contact with associated company
      await db.contact.update({
        where: { id: contact.id },
        data: { associated_company_id: company.id }
      })
    }

    // Create deal
    const deal = await db.deal.create({
      data: {
        deal_name: dealName,
        stage: DealStage.NEW_LEAD,
        associated_contact_id: contact.id,
        associated_company_id: company?.id,
        kyc_status: KYCStatus.PENDING,
        due_diligence_notes: dealDescription || null,
        owner_user_id: "cme5r3wgt0000xcntmuhzst3h", // Default to admin user
      }
    })

    // Handle file uploads
    const documentFiles = [
      { file: formData.get('idDocument') as File, type: DocumentType.ID },
      { file: formData.get('passportDocument') as File, type: DocumentType.PASSPORT },
      { file: formData.get('companyCertDocument') as File, type: DocumentType.COMPANY_CERT },
      { file: formData.get('amlDocument') as File, type: DocumentType.AML },
      { file: formData.get('pitchDeckDocument') as File, type: DocumentType.PITCH_DECK },
    ]

    for (const { file, type } of documentFiles) {
      if (file && file.size > 0) {
        // Generate unique filename
        const uniqueFileName = `${Date.now()}-${file.name}`
        const filePath = path.join(uploadsDir, uniqueFileName)

        // Save file to disk
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Create document record
        await db.document.create({
          data: {
            file_name: file.name,
            storage_path: filePath,
            file_type: type,
            uploaded_by_user_id: "cme5r3wgt0000xcntmuhzst3h", // Default to admin user
            associated_deal_id: deal.id,
          }
        })
      }
    }

    // Create initial tasks for the onboarding process
    await db.task.createMany({
      data: [
        {
          title: "Review KYC Documents",
          description: `Review submitted KYC documents for ${fullName}`,
          status: "PENDING",
          assigned_to_user_id: "cme5r3wgt0000xcntmuhzst3h",
          parent_document_id: deal.id,
          parent_document_type: "DEAL",
        },
        {
          title: "Initial Contact Follow-up",
          description: `Contact ${fullName} to discuss the ${dealName} opportunity`,
          status: "PENDING",
          assigned_to_user_id: "cme5r3wgt0000xcntmuhzst3h",
          parent_document_id: deal.id,
          parent_document_type: "DEAL",
        },
        {
          title: "Due Diligence Review",
          description: `Conduct due diligence on ${dealName}`,
          status: "PENDING",
          assigned_to_user_id: "cme5r3wgt0000xcntmuhzst3h",
          parent_document_id: deal.id,
          parent_document_type: "DEAL",
        }
      ]
    })

    return NextResponse.json({ 
      success: true, 
      message: "Onboarding application submitted successfully",
      dealId: deal.id 
    }, { status: 201 })

  } catch (error) {
    console.error("Failed to submit onboarding application:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}