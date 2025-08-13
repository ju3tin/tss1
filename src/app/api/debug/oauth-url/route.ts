import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/calendar/auth/google/callback'
)

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - Please log in first" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: user.id
    })

    return NextResponse.json({
      authUrl,
      clientId: process.env.GOOGLE_CLIENT_ID,
      redirectUri: process.env.NEXTAUTH_URL + '/api/calendar/auth/google/callback',
      scopes: SCOPES,
      userId: user.id,
      userEmail: session.user.email,
      instructions: "Copy this URL and paste it in your browser to test OAuth flow manually"
    })

  } catch (error) {
    console.error("OAuth URL debug error:", error)
    return NextResponse.json({
      error: "Failed to generate OAuth URL",
      details: error.message
    }, { status: 500 })
  }
}