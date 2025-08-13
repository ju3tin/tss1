import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AIAnalysisType, AnalysisTarget } from "@prisma/client"
import ZAI from 'z-ai-web-dev-sdk'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as AIAnalysisType
    const targetType = searchParams.get('targetType') as AnalysisTarget
    const targetId = searchParams.get('targetId')

    const where: any = {}
    
    if (type) where.analysis_type = type
    if (targetType) where.target_type = targetType
    if (targetId) where.target_id = targetId

    const analyses = await db.aIAnalysis.findMany({
      where,
      include: {
        created_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true
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

    return NextResponse.json(analyses)

  } catch (error) {
    console.error("Error fetching AI analyses:", error)
    return NextResponse.json(
      { error: "Failed to fetch AI analyses" },
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
      analysis_type, 
      target_id, 
      target_type, 
      prompt, 
      use_custom_prompt 
    } = await request.json()

    if (!analysis_type || !target_id || !target_type) {
      return NextResponse.json(
        { error: "Analysis type, target ID, and target type are required" },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    let finalPrompt = prompt
    let analysisResult = ""
    let confidenceScore = 0.7
    let redFlags: string[] = []
    let swotAnalysis: any = null

    // Fetch target data
    let targetData = {}
    if (target_type === AnalysisTarget.DEAL) {
      const deal = await db.deal.findUnique({
        where: { id: target_id },
        include: {
          associated_contact: true,
          associated_company: true,
          documents: true
        }
      })
      targetData = deal
    } else if (target_type === AnalysisTarget.DOCUMENT) {
      const document = await db.document.findUnique({
        where: { id: target_id },
        include: {
          associated_deal: {
            include: {
              associated_contact: true,
              associated_company: true
            }
          }
        }
      })
      targetData = document
    }

    // Generate prompt based on analysis type if not custom
    if (!use_custom_prompt) {
      switch (analysis_type) {
        case AIAnalysisType.RED_FLAG_DETECTION:
          finalPrompt = `
            Analyze the following ${target_type.toLowerCase()} for potential red flags and risk factors:
            
            ${JSON.stringify(targetData, null, 2)}
            
            Please identify:
            1. Any red flags or warning signs
            2. Potential compliance issues
            3. Risk factors that should be investigated further
            4. Unusual patterns or inconsistencies
            
            Return your analysis in JSON format with:
            - summary: Overall risk assessment
            - red_flags: Array of specific red flags found
            - confidence_score: Your confidence in the analysis (0-1)
            - recommendations: Suggested next steps
          `
          break

        case AIAnalysisType.SWOT_ANALYSIS:
          finalPrompt = `
            Conduct a SWOT analysis for the following ${target_type.toLowerCase()}:
            
            ${JSON.stringify(targetData, null, 2)}
            
            Please provide a comprehensive analysis including:
            - Strengths: Internal positive attributes
            - Weaknesses: Internal negative attributes
            - Opportunities: External positive factors
            - Threats: External negative factors
            
            Return your analysis in JSON format with:
            - summary: Overall assessment
            - swot: Object with strengths, weaknesses, opportunities, threats arrays
            - confidence_score: Your confidence in the analysis (0-1)
            - recommendations: Strategic recommendations
          `
          break

        case AIAnalysisType.DOCUMENT_SUMMARY:
          finalPrompt = `
            Summarize the following document and extract key information:
            
            ${JSON.stringify(targetData, null, 2)}
            
            Please provide:
            1. Executive summary
            2. Key points and highlights
            3. Important dates and figures
            4. Action items or next steps
            
            Return your analysis in JSON format with:
            - summary: Executive summary
            - key_points: Array of key points
            - important_info: Object with dates, figures, etc.
            - confidence_score: Your confidence in the analysis (0-1)
          `
          break

        default:
          finalPrompt = `Analyze the following ${target_type.toLowerCase()}: ${JSON.stringify(targetData, null, 2)}`
      }
    }

    // Perform AI analysis
    const aiCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert AI analyst specializing in investment due diligence and risk assessment."
        },
        {
          role: "user",
          content: finalPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const aiResponse = aiCompletion.choices[0]?.message?.content || ""

    try {
      // Try to parse JSON response
      const parsedResponse = JSON.parse(aiResponse)
      analysisResult = parsedResponse.summary || aiResponse
      confidenceScore = parsedResponse.confidence_score || 0.7
      redFlags = parsedResponse.red_flags || []
      swotAnalysis = parsedResponse.swot ? JSON.stringify(parsedResponse.swot) : null
    } catch (error) {
      // If not JSON, use raw response
      analysisResult = aiResponse
    }

    // Save analysis to database
    const analysis = await db.aIAnalysis.create({
      data: {
        analysis_type,
        target_id,
        target_type,
        prompt: finalPrompt,
        result: analysisResult,
        confidence_score: confidenceScore,
        red_flags: redFlags.length > 0 ? JSON.stringify(redFlags) : null,
        swot_analysis: swotAnalysis,
        created_by_user_id: session.user.id
      },
      include: {
        created_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        deal: target_type === AnalysisTarget.DEAL ? {
          select: {
            id: true,
            deal_name: true,
            stage: true
          }
        } : undefined
      }
    })

    // Update deal with AI summary if it's a deal analysis
    if (target_type === AnalysisTarget.DEAL) {
      await db.deal.update({
        where: { id: target_id },
        data: {
          ai_analysis_summary: analysisResult,
          updated_at: new Date()
        }
      })
    }

    return NextResponse.json({
      message: "AI analysis completed successfully",
      analysis,
      parsed_response: {
        red_flags: redFlags,
        swot_analysis: swotAnalysis ? JSON.parse(swotAnalysis) : null,
        confidence_score: confidenceScore
      }
    })

  } catch (error) {
    console.error("Error performing AI analysis:", error)
    return NextResponse.json(
      { error: "Failed to perform AI analysis" },
      { status: 500 }
    )
  }
}