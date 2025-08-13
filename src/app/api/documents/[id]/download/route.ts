import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await db.document.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Read file from disk
    const fileBuffer = await readFile(document.storage_path)
    
    // Create response with file
    const response = new NextResponse(fileBuffer)
    response.headers.set('Content-Type', 'application/octet-stream')
    response.headers.set('Content-Disposition', `attachment; filename="${document.file_name}"`)
    
    return response
  } catch (error) {
    console.error("Failed to download document:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}