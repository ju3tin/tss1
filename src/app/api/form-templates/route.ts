import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { FormType, FormPriority } from '@prisma/client'

export async function POST(request: NextRequest) {
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
      priority = FormPriority.MEDIUM
    } = body

    // Validate required fields
    if (!name || !form_type || !form_fields) {
      return NextResponse.json(
        { error: 'Missing required fields: name, form_type, form_fields' },
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

    // Check if auto_assign_to user exists
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

    // Create the form template
    const formTemplate = await db.formTemplate.create({
      data: {
        name,
        description,
        form_type,
        form_fields: JSON.stringify(form_fields),
        validation_rules: validation_rules ? JSON.stringify(validation_rules) : null,
        auto_assign_to,
        priority,
        created_by_user_id: session.user.id
      },
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
      message: 'Form template created successfully',
      form_template: formTemplate
    })

  } catch (error) {
    console.error('Error creating form template:', error)
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
    const form_type = searchParams.get('form_type')
    const is_active = searchParams.get('is_active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (form_type && Object.values(FormType).includes(form_type as FormType)) {
      where.form_type = form_type
    }
    
    if (is_active !== null) {
      where.is_active = is_active === 'true'
    }

    // Get form templates with pagination
    const [templates, total] = await Promise.all([
      db.formTemplate.findMany({
        where,
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
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      }),
      db.formTemplate.count({ where })
    ])

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching form templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}