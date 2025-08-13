import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AssignmentStatus } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes, due_date } = body

    // Validate status
    if (status && !Object.values(AssignmentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if assignment exists
    const assignment = await db.formAssignment.findUnique({
      where: { id: params.id },
      include: {
        form_submission: true
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if user is authorized to update this assignment
    if (assignment.assigned_to_user_id !== session.user.id && 
        assignment.assigned_by_user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this assignment' },
        { status: 403 }
      )
    }

    // Update assignment
    const updateData: any = {}
    if (status) updateData.status = status
    if (notes) updateData.notes = notes
    if (due_date) updateData.due_date = new Date(due_date)
    
    // If status is completed, set completed_at
    if (status === AssignmentStatus.COMPLETED) {
      updateData.completed_at = new Date()
    }

    const updatedAssignment = await db.formAssignment.update({
      where: { id: params.id },
      data: updateData,
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

    // Update form submission status if needed
    if (status === AssignmentStatus.COMPLETED) {
      await db.formSubmission.update({
        where: { id: assignment.form_submission_id },
        data: { status: 'COMPLETED' }
      })
    } else if (status === AssignmentStatus.IN_PROGRESS) {
      await db.formSubmission.update({
        where: { id: assignment.form_submission_id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    return NextResponse.json({
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    })

  } catch (error) {
    console.error('Error updating form assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if assignment exists
    const assignment = await db.formAssignment.findUnique({
      where: { id: params.id }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if user is authorized to delete this assignment
    if (assignment.assigned_by_user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this assignment' },
        { status: 403 }
      )
    }

    // Delete assignment
    await db.formAssignment.delete({
      where: { id: params.id }
    })

    // Update form submission status if this was the only assignment
    const remainingAssignments = await db.formAssignment.count({
      where: { form_submission_id: assignment.form_submission_id }
    })

    if (remainingAssignments === 0) {
      await db.formSubmission.update({
        where: { id: assignment.form_submission_id },
        data: { 
          assigned_to_user_id: null,
          status: 'PENDING'
        }
      })
    }

    return NextResponse.json({
      message: 'Assignment deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting form assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}