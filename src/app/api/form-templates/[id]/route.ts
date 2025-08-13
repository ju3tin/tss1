import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { FormType, FormPriority } from '@prisma/client'

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
    const {
      name,
      description,
      form_type,
      form_fields,
      validation_rules,
      auto_assign_to,
      priority,
      is_active
    } = body

    // Check if template exists
    const existingTemplate = await db.formTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      )
    }

    // Validate form_type if provided
    if (form_type && !Object.values(FormType).includes(form_type)) {
      return NextResponse.json(
        { error: 'Invalid form_type' },
        { status: 400 }
      )
    }

    // Validate priority if provided
    if (priority && !Object.values(FormPriority).includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      )
    }

    // Check if auto_assign_to user exists if provided
    if (auto_assign_to) {
      const user = await db.user.findUnique({
        where: { id: auto_assign_to }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Auto-assign user not found' },
          { status: 404 }
        )
      }
    }

    // Update the form template
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (form_type !== undefined) updateData.form_type = form_type
    if (form_fields !== undefined) updateData.form_fields = JSON.stringify(form_fields)
    if (validation_rules !== undefined) updateData.validation_rules = validation_rules ? JSON.stringify(validation_rules) : null
    if (auto_assign_to !== undefined) updateData.auto_assign_to = auto_assign_to
    if (priority !== undefined) updateData.priority = priority
    if (is_active !== undefined) updateData.is_active = is_active

    const formTemplate = await db.formTemplate.update({
      where: { id: params.id },
      data: updateData,
      include: {
        created_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        auto_assign_to_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Form template updated successfully',
      form_template: formTemplate
    })

  } catch (error) {
    console.error('Error updating form template:', error)
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

    // Check if template exists
    const existingTemplate = await db.formTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      )
    }

    // Delete the form template
    await db.formTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Form template deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting form template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}