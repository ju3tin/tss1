import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DocumentType } from "@prisma/client"
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const documentId = params.id
    const { analysis_type, custom_prompt } = await request.json()

    // Fetch the document
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        associated_deal: {
          include: {
            associated_contact: true,
            associated_company: true
          }
        },
        uploaded_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const zai = await ZAI.create()

    let prompt = ""
    let analysisResult = ""
    let summary = ""

    // Generate appropriate prompt based on document type and analysis request
    switch (document.file_type) {
      case DocumentType.PITCH_DECK:
        prompt = custom_prompt || `
          Analyze this pitch deck document and provide a comprehensive summary:
          
          Document: ${document.file_name}
          Type: Pitch Deck
          Deal: ${document.associated_deal?.deal_name || 'N/A'}
          Company: ${document.associated_deal?.associated_company?.name || 'N/A'}
          
          Please provide:
          1. Executive summary of the business concept
          2. Key value propositions
          3. Market analysis highlights
          4. Financial highlights and projections
          5. Team strengths
          6. Investment opportunity assessment
          7. Potential risks or concerns
          8. Overall recommendation
          
          Return your analysis in a structured format.
        `
        break

      case DocumentType.BUSINESS_PLAN:
        prompt = custom_prompt || `
          Analyze this business plan document:
          
          Document: ${document.file_name}
          Type: Business Plan
          Deal: ${document.associated_deal?.deal_name || 'N/A'}
          
          Please provide:
          1. Business model analysis
          2. Market opportunity assessment
          3. Competitive landscape
          4. Financial projections summary
          5. Operational plan highlights
          6. Management team evaluation
          7. Risk factors and mitigation strategies
          8. Investment merits and concerns
          
          Return your analysis in a structured format.
        `
        break

      case DocumentType.PPM:
        prompt = custom_prompt || `
          Analyze this Private Placement Memorandum (PPM):
          
          Document: ${document.file_name}
          Type: PPM
          Deal: ${document.associated_deal?.deal_name || 'N/A'}
          
          Please provide:
          1. Investment terms summary
          2. Risk factors assessment
          3. Use of proceeds analysis
          4. Management team background
          5. Business description highlights
          6. Financial summary
          7. Legal structure overview
          8. Subscription details
          9. Overall investment recommendation
          
          Return your analysis in a structured format.
        `
        break

      default:
        prompt = custom_prompt || `
          Analyze this document:
          
          Document: ${document.file_name}
          Type: ${document.file_type}
          Deal: ${document.associated_deal?.deal_name || 'N/A'}
          
          Please provide a comprehensive analysis including key points, important information, and any notable findings.
        `
    }

    // Perform AI analysis
    const aiCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert financial analyst specializing in investment documents, due diligence, and business assessment."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    analysisResult = aiCompletion.choices[0]?.message?.content || ""

    // Generate a concise summary
    const summaryPrompt = `
      Provide a concise summary of the following analysis in 2-3 sentences:
      
      ${analysisResult}
    `
    
    const summaryCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at summarizing complex information concisely."
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    summary = summaryCompletion.choices[0]?.message?.content || ""

    // Update document with AI summary
    await db.document.update({
      where: { id: documentId },
      data: {
        ai_summary: summary,
        updated_at: new Date()
      }
    })

    // Create AI analysis record
    const aiAnalysis = await db.aIAnalysis.create({
      data: {
        analysis_type: analysis_type || 'DOCUMENT_SUMMARY',
        target_id: documentId,
        target_type: 'DOCUMENT',
        prompt: prompt,
        result: analysisResult,
        confidence_score: 0.8,
        created_by_user_id: session.user.id
      }
    })

    return NextResponse.json({
      message: "Document analysis completed successfully",
      document: {
        ...document,
        ai_summary: summary
      },
      analysis: {
        id: aiAnalysis.id,
        result: analysisResult,
        confidence_score: 0.8
      }
    })

  } catch (error) {
    console.error("Error analyzing document:", error)
    return NextResponse.json(
      { error: "Failed to analyze document" },
      { status: 500 }
    )
  }
}