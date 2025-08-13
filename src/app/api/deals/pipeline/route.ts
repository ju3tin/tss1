import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DealStage, PipelinePriority } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage') as DealStage
    const priority = searchParams.get('priority') as PipelinePriority
    const ownerId = searchParams.get('ownerId')

    const where: any = {}
    
    if (stage) where.stage = stage
    if (priority) where.pipeline_priority = priority
    if (ownerId) where.owner_user_id = ownerId

    const deals = await db.deal.findMany({
      where,
      include: {
        associated_contact: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        associated_company: {
          select: {
            id: true,
            name: true
          }
        },
        owner: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        agreements: {
          select: {
            id: true,
            agreement_type: true,
            status: true
          }
        },
        ai_analyses: {
          select: {
            id: true,
            analysis_type: true,
            confidence_score: true,
            created_at: true
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        { pipeline_priority: 'desc' },
        { expected_close_date: 'asc' },
        { created_at: 'desc' }
      ]
    })

    // Calculate pipeline metrics
    const totalDeals = deals.length
    const totalValue = deals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)
    
    const stageDistribution = deals.reduce((acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1
      return acc
    }, {} as Record<DealStage, number>)

    const priorityDistribution = deals.reduce((acc, deal) => {
      acc[deal.pipeline_priority] = (acc[deal.pipeline_priority] || 0) + 1
      return acc
    }, {} as Record<PipelinePriority, number>)

    // Calculate weighted pipeline value (probability-based)
    const stageWeights = {
      [DealStage.NEW_LEAD]: 0.1,
      [DealStage.KYC_IN_PROGRESS]: 0.3,
      [DealStage.DUE_DILIGENCE]: 0.5,
      [DealStage.CONTRACT_SIGNING]: 0.8,
      [DealStage.ONBOARDED]: 1.0,
      [DealStage.REJECTED]: 0
    }

    const weightedPipelineValue = deals.reduce((sum, deal) => {
      return sum + (deal.deal_value || 0) * stageWeights[deal.stage]
    }, 0)

    return NextResponse.json({
      deals,
      metrics: {
        total_deals: totalDeals,
        total_value: totalValue,
        weighted_pipeline_value: weightedPipelineValue,
        stage_distribution: stageDistribution,
        priority_distribution: priorityDistribution,
        average_deal_value: totalDeals > 0 ? totalValue / totalDeals : 0
      }
    })

  } catch (error) {
    console.error("Error fetching pipeline data:", error)
    return NextResponse.json(
      { error: "Failed to fetch pipeline data" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId, stage, priority, expectedCloseDate, dealValue } = await request.json()

    if (!dealId) {
      return NextResponse.json({ error: "Deal ID is required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date() }
    
    if (stage) updateData.stage = stage
    if (priority) updateData.pipeline_priority = priority
    if (expectedCloseDate) updateData.expected_close_date = new Date(expectedCloseDate)
    if (dealValue !== undefined) updateData.deal_value = dealValue

    const updatedDeal = await db.deal.update({
      where: { id: dealId },
      data: updateData,
      include: {
        associated_contact: true,
        associated_company: true,
        owner: true
      }
    })

    return NextResponse.json({
      message: "Deal pipeline updated successfully",
      deal: updatedDeal
    })

  } catch (error) {
    console.error("Error updating deal pipeline:", error)
    return NextResponse.json(
      { error: "Failed to update deal pipeline" },
      { status: 500 }
    )
  }
}