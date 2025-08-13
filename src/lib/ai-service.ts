import ZAI from 'z-ai-web-dev-sdk'

export interface AIAnalysisResult {
  summary: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  recommendations: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
}

export class AIService {
  private static instance: ZAI | null = null

  private static async getInstance(): Promise<ZAI> {
    if (!AIService.instance) {
      AIService.instance = await ZAI.create()
    }
    return AIService.instance
  }

  static async analyzeDocument(documentContent: string, documentType: string): Promise<AIAnalysisResult> {
    try {
      const zai = await AIService.getInstance()

      const prompt = `
        You are an expert investment analyst conducting due diligence on a ${documentType}. 
        Please analyze the following document content and provide a comprehensive assessment.

        Document Content:
        ${documentContent}

        Please provide your analysis in the following JSON format:
        {
          "summary": "Brief summary of the document",
          "strengths": ["Strength 1", "Strength 2", "Strength 3"],
          "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
          "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
          "threats": ["Threat 1", "Threat 2", "Threat 3"],
          "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
          "riskLevel": "LOW" | "MEDIUM" | "HIGH",
          "confidence": 0.85
        }

        Focus on:
        1. Business model viability
        2. Market opportunity and competition
        3. Financial projections and sustainability
        4. Management team and expertise
        5. Risk factors and mitigation strategies
        6. Investment potential and return prospects

        Be thorough, objective, and provide actionable insights.
      `

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert investment analyst specializing in due diligence and investment analysis. Provide detailed, objective, and actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })

      const responseContent = completion.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('No response from AI service')
      }

      // Parse the JSON response
      const analysisResult: AIAnalysisResult = JSON.parse(responseContent)
      
      return analysisResult
    } catch (error) {
      console.error('AI analysis failed:', error)
      throw new Error('Failed to analyze document with AI')
    }
  }

  static async generateInvestmentSummary(dealData: {
    dealName: string
    contactName: string
    companyName?: string
    dealDescription?: string
    investorType: string
  }): Promise<string> {
    try {
      const zai = await AIService.getInstance()

      const prompt = `
        Generate a concise investment summary for the following deal:

        Deal Name: ${dealData.dealName}
        Contact: ${dealData.contactName}
        Company: ${dealData.companyName || 'N/A'}
        Investor Type: ${dealData.investorType}
        Description: ${dealData.dealDescription || 'No description provided'}

        Please provide a 2-3 sentence summary that highlights the key investment opportunity and potential.
      `

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert investment analyst. Generate concise, compelling investment summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 200,
      })

      return completion.choices[0]?.message?.content || 'Unable to generate summary'
    } catch (error) {
      console.error('Failed to generate investment summary:', error)
      return 'Unable to generate investment summary at this time.'
    }
  }
}