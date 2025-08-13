import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AssignmentStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      form_submission_id,
      assigned_to_user_id,
      due_date,
      notes
    } = body

    // Validate required fields
    if (!form_submission_id || !assigned_to_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: form_submission_id, assigned_to_user_id' },
        { status: 400 }
      )
    }

    // Check if form submission exists
    const formSubmission = await db.formSubmission.findUnique({
      where: { id: form_submission_id }
    })

    if (!formSubmission) {
      return NextResponse.json(
        { error: 'Form submission not found' },
        { status: 404 }
      )
    }

    // Check if user exists
    const assignedUser = await db.user.findUnique({
      where: { id: assigned_to_user_id }
    })

    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 404 }
      )
    }

    // Create the assignment
    const assignment = await db.formAssignment.create({
      data: {
        form_submission_id,
        assigned_to_user_id,
        assigned_by_user_id: session.user.id,
        due_date: due_date ? new Date(due_date) : null,
        notes,
        status: AssignmentStatus.PENDING
      },
      include: {
        form_submission: {
          include: {
            assigned_to: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        assigned_to: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        assigned_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    })

    // Update form submission status
    await db.formSubmission.update({
      where: { id: form_submission_id },
      data: {
        assigned_to_user_id,
        status: 'ASSIGNED'
      }
    })

    return NextResponse.json({
      message: 'Form assignment created successfully',
      assignment
    })

  } catch (error) {
    console.error('Error creating form assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assigned_to = searchParams.get('assigned_to')
    const assigned_by = searchParams.get('assigned_by')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (assigned_to) {
      where.assigned_to_user_id = assigned_to
    }
    
    if (assigned_by) {
      where.assigned_by_user_id = assigned_by
    }
    
    if (status && Object.values(AssignmentStatus).includes(status as AssignmentStatus)) {
      where.status = status
    }

    // Get assignments with pagination
    const [assignments, total] = await Promise.all([
      db.formAssignment.findMany({
        where,
        include: {
          form_submission: true,
          assigned_to: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          assigned_by: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      }),
      db.formAssignment.count({ where })
    ])

    return NextResponse.json({
      assignments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching form assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}