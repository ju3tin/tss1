import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AgreementType, AgreementStatus } from "@prisma/client"
import ZAI from 'z-ai-web-dev-sdk'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as AgreementType
    const status = searchParams.get('status') as AgreementStatus
    const contactId = searchParams.get('contactId')
    const dealId = searchParams.get('dealId')

    const where: any = {}
    
    if (type) where.agreement_type = type
    if (status) where.status = status
    if (contactId) where.contact_id = contactId
    if (dealId) where.deal_id = dealId

    const agreements = await db.agreement.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        deal: {
          select: {
            id: true,
            deal_name: true,
            stage: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json(agreements)

  } catch (error) {
    console.error("Error fetching agreements:", error)
    return NextResponse.json(
      { error: "Failed to fetch agreements" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      agreement_type, 
      title, 
      content, 
      contact_id, 
      deal_id,
      generate_with_ai 
    } = await request.json()

    if (!agreement_type || !title || !contact_id) {
      return NextResponse.json(
        { error: "Agreement type, title, and contact ID are required" },
        { status: 400 }
      )
    }

    let finalContent = content

    // Generate agreement content with AI if requested
    if (generate_with_ai) {
      const zai = await ZAI.create()
      
      const contact = await db.contact.findUnique({
        where: { id: contact_id },
        include: {
          associated_company: true
        }
      })

      const deal = deal_id ? await db.deal.findUnique({
        where: { id: deal_id }
      }) : null

      const aiPrompt = `
        Generate a professional ${agreement_type.replace('_', ' ')} agreement with the following details:
        
        Contact: ${contact?.full_name} (${contact?.email})
        Company: ${contact?.associated_company?.name || 'N/A'}
        Deal: ${deal?.deal_name || 'N/A'}
        
        Agreement Title: ${title}
        
        Please generate a comprehensive agreement that includes:
        1. Parties involved
        2. Purpose and scope
        3. Terms and conditions
        4. Confidentiality clauses (if applicable)
        5. Duration and termination
        6. Governing law
        7. Signatures
        
        Return only the agreement content without any additional text.
      `

      const aiCompletion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a legal expert specializing in investment agreements and contracts."
          },
          {
            role: "user",
            content: aiPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      finalContent = aiCompletion.choices[0]?.message?.content || content
    }

    const agreement = await db.agreement.create({
      data: {
        agreement_type,
        title,
        content: finalContent || content,
        contact_id,
        deal_id,
        created_by_user_id: session.user.id
      },
      include: {
        contact: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        deal: {
          select: {
            id: true,
            deal_name: true,
            stage: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Agreement created successfully",
      agreement,
      ai_generated: generate_with_ai
    })

  } catch (error) {
    console.error("Error creating agreement:", error)
    return NextResponse.json(
      { error: "Failed to create agreement" },
      { status: 500 }
    )
  }
}