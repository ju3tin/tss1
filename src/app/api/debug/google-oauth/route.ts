import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const debugInfo = {
      environment: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "***SET***" : "***NOT SET***",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "***SET***" : "***NOT SET***",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "***NOT SET***"
      },
      redirectUri: process.env.NEXTAUTH_URL + '/api/calendar/auth/google/callback',
      expectedRedirectUri: "http://localhost:3000/api/calendar/auth/google/callback",
      timestamp: new Date().toISOString(),
      instructions: `
To fix the 403 error, make sure:

1. In Google Cloud Console:
   - Go to APIs & Services > Credentials
   - Find your OAuth 2.0 Client ID
   - Click "Edit OAuth Client"
   - Add this exact redirect URI:
     ${process.env.NEXTAUTH_URL}/api/calendar/auth/google/callback

2. Make sure Google Calendar API is enabled:
   - Go to APIs & Services > Library
   - Search for "Google Calendar API"
   - Click "Enable"

3. Check OAuth consent screen:
   - Go to APIs & Services > OAuth consent screen
   - Make sure it's published
   - For development, use "Testing" mode
   - Add your email as a test user
      `
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint failed",
      details: error.message
    }, { status: 500 })
  }
}