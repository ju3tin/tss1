import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get basic counts
    const [
      totalContacts,
      totalCompanies,
      totalDeals,
      totalTasks,
      totalDocuments
    ] = await Promise.all([
      db.contact.count(),
      db.company.count(),
      db.deal.count(),
      db.task.count(),
      db.document.count()
    ])

    // Get deals by stage
    const dealsByStage = await db.deal.groupBy({
      by: ['stage'],
      _count: {
        stage: true,
      },
      orderBy: {
        stage: 'asc',
      },
    })

    // Get deals by month for the last 6 months
    const dealsByMonth = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const count = await db.deal.count({
        where: {
          created_at: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })
      
      dealsByMonth.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        deals: count,
      })
    }

    // Get contacts by type
    const contactsByType = await db.contact.groupBy({
      by: ['investor_type'],
      _count: {
        investor_type: true,
      },
      orderBy: {
        investor_type: 'asc',
      },
    })

    // Get tasks by status
    const tasksByStatus = await db.task.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      orderBy: {
        status: 'asc',
      },
    })

    // Get documents by type
    const documentsByType = await db.document.groupBy({
      by: ['file_type'],
      _count: {
        file_type: true,
      },
      orderBy: {
        file_type: 'asc',
      },
    })

    // Get top recent deals
    const topDeals = await db.deal.findMany({
      include: {
        associated_contact: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    })

    // Format data for charts
    const analyticsData = {
      totalContacts,
      totalCompanies,
      totalDeals,
      totalTasks,
      totalDocuments,
      dealsByStage: dealsByStage.map(item => ({
        stage: item.stage.replace('_', ' '),
        count: item._count.stage,
      })),
      dealsByMonth,
      contactsByType: contactsByType.map(item => ({
        type: item.investor_type.replace('_', ' '),
        count: item._count.investor_type,
      })),
      tasksByStatus: tasksByStatus.map(item => ({
        status: item.status.replace('_', ' '),
        count: item._count.status,
      })),
      documentsByType: documentsByType.map(item => ({
        type: item.file_type.replace('_', ' '),
        count: item._count.file_type,
      })),
      topDeals: topDeals.map(deal => ({
        id: deal.id,
        deal_name: deal.deal_name,
        stage: deal.stage,
        created_at: deal.created_at.toISOString(),
        associated_contact: deal.associated_contact,
      })),
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}