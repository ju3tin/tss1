import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { unlink } from "fs/promises"
import path from "path"

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
    const { file_name, file_type, associated_deal_id } = body

    const updateData: any = {
      file_name,
      file_type,
      associated_deal_id,
    }

    const document = await db.document.update({
      where: { id: params.id },
      data: updateData,
      include: {
        uploaded_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        associated_deal: {
          select: {
            id: true,
            deal_name: true,
          },
        },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Failed to update document:", error)
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

    // Get document info to delete the file
    const document = await db.document.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete file from disk
    try {
      await unlink(document.storage_path)
    } catch (error) {
      console.error("Failed to delete file:", error)
    }

    // Delete document record from database
    await db.document.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete document:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}