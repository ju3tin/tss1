import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { FormType, FormSubmissionStatus, FormPriority } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      form_name,
      form_type,
      submission_data,
      contact_email,
      contact_name,
      captcha_token
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
        priority: formTemplate?.priority || FormPriority.MEDIUM,
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
          assigned_by_user_id: formTemplate.created_by_user_id,
          status: 'PENDING'
        }
      })
    }

    return NextResponse.json({
      message: 'Form submitted successfully',
      submission_id: formSubmission.id,
      status: formSubmission.status
    })

  } catch (error) {
    console.error('Error submitting form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}