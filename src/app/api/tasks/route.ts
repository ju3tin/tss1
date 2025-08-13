import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tasks = await db.task.findMany({
      include: {
        assigned_to: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Failed to fetch tasks:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, due_date, status, assigned_to_user_id, parent_document_id, parent_document_type } = body

    if (!title || !status || !assigned_to_user_id || !parent_document_id || !parent_document_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const task = await db.task.create({
      data: {
        title,
        description: description || null,
        due_date: due_date ? new Date(due_date) : null,
        status,
        assigned_to_user_id,
        parent_document_id,
        parent_document_type,
      },
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Failed to create task:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}