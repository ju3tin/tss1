import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { FormType, FormSubmissionStatus, FormPriority } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      form_name,
      form_type,
      submission_data,
      contact_email,
      contact_name,
      priority = FormPriority.MEDIUM,
      notes
    } = body

    // Validate required fields
    if (!form_name || !form_type || !submission_data) {
      return NextResponse.json(
        { error: 'Missing required fields: form_name, form_type, submission_data' },
        { status: 400 }
      )
    }

    // Validate form_type
    if (!Object.values(FormType).includes(form_type)) {
      return NextResponse.json(
        { error: 'Invalid form_type' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const source_ip = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const user_agent = request.headers.get('user-agent') || 'unknown'

    // Check if there's a form template for auto-assignment
    const formTemplate = await db.formTemplate.findFirst({
      where: {
        form_type,
        is_active: true
      }
    })

    // Create the form submission
    const formSubmission = await db.formSubmission.create({
      data: {
        form_name,
        form_type,
        submission_data: JSON.stringify(submission_data),
        source_ip,
        user_agent,
        contact_email,
        contact_name,
        priority,
        notes,
        assigned_to_user_id: formTemplate?.auto_assign_to || null,
        status: formTemplate?.auto_assign_to ? FormSubmissionStatus.ASSIGNED : FormSubmissionStatus.PENDING
      },
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
    })

    // If auto-assigned, create the assignment record
    if (formTemplate?.auto_assign_to) {
      await db.formAssignment.create({
        data: {
          form_submission_id: formSubmission.id,
          assigned_to_user_id: formTemplate.auto_assign_to,
          assigned_by_user_id: session.user.id,
          status: 'PENDING'
        }
      })
    }

    return NextResponse.json({
      message: 'Form submission created successfully',
      form_submission: formSubmission
    })

  } catch (error) {
    console.error('Error creating form submission:', error)
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
    const status = searchParams.get('status')
    const form_type = searchParams.get('form_type')
    const assigned_to = searchParams.get('assigned_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && Object.values(FormSubmissionStatus).includes(status as FormSubmissionStatus)) {
      where.status = status
    }
    
    if (form_type && Object.values(FormType).includes(form_type as FormType)) {
      where.form_type = form_type
    }
    
    if (assigned_to) {
      where.assigned_to_user_id = assigned_to
    }

    // Get form submissions with pagination
    const [submissions, total] = await Promise.all([
      db.formSubmission.findMany({
        where,
        include: {
          assigned_to: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          form_assignments: {
            include: {
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
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      }),
      db.formSubmission.count({ where })
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching form submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}