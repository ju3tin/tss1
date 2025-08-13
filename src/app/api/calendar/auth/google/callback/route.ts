import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { db } from "@/lib/db"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/calendar/auth/google/callback'
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/calendar?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/calendar?error=missing_params`
      )
    }

    // Verify state matches user ID
    const user = await db.user.findUnique({
      where: { id: state }
    })

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/calendar?error=invalid_user`
      )
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Store tokens in database
    await db.googleCalendarSync.upsert({
      where: { user_id: user.id },
      update: {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        is_sync_enabled: true,
        updated_at: new Date()
      },
      create: {
        user_id: user.id,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        is_sync_enabled: true,
        calendar_id: "primary"
      }
    })

    // Redirect back to calendar page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/calendar?success=calendar_connected`
    )

  } catch (error) {
    console.error("Google Calendar callback error:", error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/calendar?error=callback_failed`
    )
  }
}