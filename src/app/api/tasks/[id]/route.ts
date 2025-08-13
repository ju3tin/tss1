import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, due_date, status, assigned_to_user_id, parent_document_id, parent_document_type } = body

    const updateData: any = {
      title,
      description: description || null,
      due_date: due_date ? new Date(due_date) : null,
      status,
      assigned_to_user_id,
      parent_document_id,
      parent_document_type,
    }

    const task = await db.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assigned_to: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Failed to update task:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete task:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}