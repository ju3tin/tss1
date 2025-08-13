import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { TaskStatus } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !Object.values(TaskStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const task = await db.task.update({
      where: { id: params.id },
      data: { status },
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
    console.error("Failed to update task status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}