import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AIService, AIAnalysisResult } from "@/lib/ai-service"
import { readFile } from "fs/promises"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get deal with associated documents
    const deal = await db.deal.findUnique({
      where: { id: params.id },
      include: {
        associated_contact: true,
        associated_company: true,
        documents: true,
      },
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Find pitch deck document
    const pitchDeck = deal.documents.find(doc => doc.file_type === 'PITCH_DECK')
    if (!pitchDeck) {
      return NextResponse.json({ error: "No pitch deck found for analysis" }, { status: 400 })
    }

    // Read pitch deck content
    let documentContent = ""
    try {
      const fileBuffer = await readFile(pitchDeck.storage_path)
      documentContent = fileBuffer.toString('utf-8')
    } catch (error) {
      console.error("Failed to read pitch deck file:", error)
      return NextResponse.json({ error: "Failed to read pitch deck file" }, { status: 500 })
    }

    // Perform AI analysis
    const analysisResult: AIAnalysisResult = await AIService.analyzeDocument(
      documentContent,
      "pitch deck"
    )

    // Update deal with AI analysis notes
    const analysisNotes = `
AI Analysis Results:
================

Summary: ${analysisResult.summary}

Strengths:
${analysisResult.strengths.map(s => `- ${s}`).join('\n')}

Weaknesses:
${analysisResult.weaknesses.map(w => `- ${w}`).join('\n')}

Opportunities:
${analysisResult.opportunities.map(o => `- ${o}`).join('\n')}

Threats:
${analysisResult.threats.map(t => `- ${t}`).join('\n')}

Recommendations:
${analysisResult.recommendations.map(r => `- ${r}`).join('\n')}

Risk Level: ${analysisResult.riskLevel}
Confidence: ${(analysisResult.confidence * 100).toFixed(1)}%

Generated on: ${new Date().toISOString()}
    `.trim()

    await db.deal.update({
      where: { id: params.id },
      data: {
        due_diligence_notes: analysisNotes,
      },
    })

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      message: "AI analysis completed successfully"
    })

  } catch (error) {
    console.error("AI analysis failed:", error)
    return NextResponse.json({ 
      error: "Failed to perform AI analysis",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}