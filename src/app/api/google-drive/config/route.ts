import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { accessToken, refreshToken, expiresIn, autoUpload = true, syncDirection = "TO_GOOGLE" } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 })
    }

    // Calculate token expiration date
    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    // Create or update Google Drive configuration
    const driveConfig = await db.googleDriveConfig.upsert({
      where: { user_id: user.id },
      update: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        auto_upload: autoUpload,
        sync_direction: syncDirection
      },
      create: {
        user_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        auto_upload: autoUpload,
        sync_direction: syncDirection
      }
    })

    // Create default folder structure if not exists
    try {
      const oauth2Client = new google.auth.OAuth2()
      oauth2Client.setCredentials({ access_token: accessToken })

      const drive = google.drive({ version: "v3", auth: oauth2Client })
      
      // Create main folder for the CRM
      const folderMetadata = {
        name: "CRM Documents",
        mimeType: "application/vnd.google-apps.folder"
      }

      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: "id"
      })

      // Update config with folder ID
      await db.googleDriveConfig.update({
        where: { id: driveConfig.id },
        data: {
          drive_folder_id: folder.data.id
        }
      })

    } catch (folderError) {
      console.error("Error creating Google Drive folder:", folderError)
      // Don't fail the entire process if folder creation fails
    }

    return NextResponse.json({
      success: true,
      config: {
        id: driveConfig.id,
        is_enabled: driveConfig.is_enabled,
        auto_upload: driveConfig.auto_upload,
        sync_direction: driveConfig.sync_direction,
        created_at: driveConfig.created_at
      }
    })

  } catch (error) {
    console.error("Google Drive config error:", error)
    return NextResponse.json(
      { error: "Failed to configure Google Drive" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const driveConfig = await db.googleDriveConfig.findUnique({
      where: { user_id: user.id }
    })

    if (!driveConfig) {
      return NextResponse.json({
        success: true,
        config: null,
        message: "Google Drive not configured"
      })
    }

    // Check if token is expired and needs refresh
    const isTokenExpired = driveConfig.token_expires_at && 
      new Date(driveConfig.token_expires_at) < new Date()

    return NextResponse.json({
      success: true,
      config: {
        id: driveConfig.id,
        is_enabled: driveConfig.is_enabled,
        auto_upload: driveConfig.auto_upload,
        sync_direction: driveConfig.sync_direction,
        drive_folder_id: driveConfig.drive_folder_id,
        token_expired: isTokenExpired,
        created_at: driveConfig.created_at,
        updated_at: driveConfig.updated_at
      }
    })

  } catch (error) {
    console.error("Error fetching Google Drive config:", error)
    return NextResponse.json(
      { error: "Failed to fetch Google Drive configuration" },
      { status: 500 }
    )
  }
}