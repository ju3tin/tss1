import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { google } from "googleapis"
import { readFile } from "fs/promises"
import path from "path"

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

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Get document and verify access
    const document = await db.document.findFirst({
      where: { 
        id: documentId,
        associated_deal: {
          OR: [
            { owner_user_id: user.id },
            { associated_contact_id: user.id }
          ]
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    // Get Google Drive configuration
    const driveConfig = await db.googleDriveConfig.findUnique({
      where: { user_id: user.id }
    })

    if (!driveConfig || !driveConfig.is_enabled) {
      return NextResponse.json({ error: "Google Drive not configured or disabled" }, { status: 400 })
    }

    // Check if token is expired
    if (driveConfig.token_expires_at && new Date(driveConfig.token_expires_at) < new Date()) {
      return NextResponse.json({ error: "Google Drive access token expired" }, { status: 401 })
    }

    // Initialize Google Drive API
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ 
      access_token: driveConfig.access_token,
      refresh_token: driveConfig.refresh_token
    })

    const drive = google.drive({ version: "v3", auth: oauth2Client })

    // Read the file
    const fileBuffer = await readFile(document.storage_path)
    const fileName = document.file_name
    const fileExtension = path.extname(fileName)
    
    // Determine MIME type
    const mimeType = getMimeType(fileExtension)

    // Create folder structure for the deal
    const dealFolderName = `${document.associated_deal_id}-${document.associated_deal.deal_name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}`
    
    try {
      // Check if deal folder exists, create if not
      let dealFolderId = driveConfig.drive_folder_id
      
      if (dealFolderName) {
        // Search for existing folder
        const folderSearch = await drive.files.list({
          q: `name='${dealFolderName}' and mimeType='application/vnd.google-apps.folder' and '${driveConfig.drive_folder_id}' in parents`,
          fields: "files(id, name)"
        })

        if (folderSearch.data.files && folderSearch.data.files.length > 0) {
          dealFolderId = folderSearch.data.files[0].id!
        } else {
          // Create new folder for the deal
          const folderMetadata = {
            name: dealFolderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [driveConfig.drive_folder_id]
          }

          const folder = await drive.files.create({
            resource: folderMetadata,
            fields: "id"
          })
          dealFolderId = folder.data.id!
        }
      }

      // Upload file to Google Drive
      const fileMetadata = {
        name: fileName,
        parents: [dealFolderId]
      }

      const media = {
        mimeType: mimeType,
        body: fileBuffer
      }

      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id, webViewLink, webContentLink"
      })

      // Set file permissions to make it viewable
      await drive.permissions.create({
        fileId: uploadedFile.data.id!,
        requestBody: {
          role: "reader",
          type: "anyone"
        }
      })

      // Update document with Google Drive information
      await db.document.update({
        where: { id: documentId },
        data: {
          google_drive_id: uploadedFile.data.id,
          google_drive_link: uploadedFile.data.webViewLink || uploadedFile.data.webContentLink,
          google_drive_folder: dealFolderId
        }
      })

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          file_name: document.file_name,
          google_drive_id: uploadedFile.data.id,
          google_drive_link: uploadedFile.data.webViewLink,
          google_drive_folder: dealFolderId
        }
      })

    } catch (driveError) {
      console.error("Google Drive upload error:", driveError)
      return NextResponse.json(
        { error: "Failed to upload file to Google Drive" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Google Drive upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload document to Google Drive" },
      { status: 500 }
    )
  }
}

function getMimeType(extension: string): string {
  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff'
  }
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}