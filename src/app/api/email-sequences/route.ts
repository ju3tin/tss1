import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { EmailSequenceType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as EmailSequenceType
    const createdBy = searchParams.get('createdBy')

    const where: any = {}
    
    if (type) where.type = type
    if (createdBy) where.created_by_user_id = createdBy

    const sequences = await db.emailSequence.findMany({
      where,
      include: {
        created_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        sequence_steps: {
          orderBy: {
            step_order: 'asc'
          }
        },
        _count: {
          select: {
            sequence_steps: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json(sequences)

  } catch (error) {
    console.error("Error fetching email sequences:", error)
    return NextResponse.json(
      { error: "Failed to fetch email sequences" },
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

    const { name, description, type, steps } = await request.json()

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    const sequence = await db.emailSequence.create({
      data: {
        name,
        description,
        type,
        created_by_user_id: session.user.id
      },
      include: {
        created_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    })

    // Create sequence steps if provided
    if (steps && Array.isArray(steps)) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        await db.emailSequenceStep.create({
          data: {
            sequence_id: sequence.id,
            step_order: i + 1,
            name: step.name || `Step ${i + 1}`,
            subject: step.subject,
            body_template: step.body_template,
            delay_days: step.delay_days || 0,
            is_ai_generated: step.is_ai_generated || false,
            ai_prompt: step.ai_prompt
          }
        })
      }
    }

    const fullSequence = await db.emailSequence.findUnique({
      where: { id: sequence.id },
      include: {
        created_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        sequence_steps: {
          orderBy: {
            step_order: 'asc'
          }
        }
      }
    })

    return NextResponse.json({
      message: "Email sequence created successfully",
      sequence: fullSequence
    })

  } catch (error) {
    console.error("Error creating email sequence:", error)
    return NextResponse.json(
      { error: "Failed to create email sequence" },
      { status: 500 }
    )
  }
}