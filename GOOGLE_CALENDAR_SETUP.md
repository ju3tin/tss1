# Google Calendar Sync Setup Guide

## Overview

This guide will help you set up Google Calendar synchronization for your CRM application.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with the Google Calendar API enabled.
2. **OAuth 2.0 Credentials**: You need to create OAuth 2.0 credentials in the Google Cloud Console.

## Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Select "Web application" as the application type
4. Configure authorized redirect URIs:
   - Add: `http://localhost:3000/api/calendar/auth/google/callback` (for development)
   - Add: `https://yourdomain.com/api/calendar/auth/google/callback` (for production)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

## Step 3: Configure Environment Variables

Update your `.env` file with the Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 4: Test the Integration

1. Start your application: `npm run dev`
2. Navigate to the Calendar page
3. Click the "Sync Google" button
4. You will be redirected to Google for authentication
5. Grant permission to access your Google Calendar
6. After successful authentication, you'll be redirected back to the Calendar page

## Step 5: Verify Sync

Once connected, you should see:
- The sync toggle enabled
- "Connected" badge
- Last sync timestamp
- Ability to manually sync events

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - Make sure you're logged into the application
   - Check that your OAuth credentials are correct

2. **"Google Calendar not configured" Error**
   - Verify that you've completed the OAuth flow
   - Check that the tokens are stored in the database

3. **"Failed to refresh access token" Error**
   - The refresh token may have expired
   - Try disconnecting and reconnecting your Google Calendar

4. **"Redirect URI mismatch" Error**
   - Make sure the redirect URI in Google Cloud Console matches exactly
   - Check for trailing slashes or http vs https

### Debug Steps

1. Check the browser console for JavaScript errors
2. Check the server logs for API errors
3. Verify the database has the Google Calendar sync records
4. Test the OAuth flow manually

## Features

The Google Calendar sync supports:

- **Two-way synchronization**: Events created in the CRM sync to Google Calendar and vice versa
- **Automatic token refresh**: Handles expired access tokens automatically
- **Event conflict detection**: Prevents duplicate events
- **Real-time updates**: Sync happens in real-time when events are created/modified
- **Selective sync**: Choose which events to sync based on date range

## API Endpoints

- `GET /api/calendar/sync` - Get sync status and events
- `POST /api/calendar/sync` - Control sync operations
- `GET /api/calendar/auth/google` - Initiate Google OAuth
- `GET /api/calendar/auth/google/callback` - Handle OAuth callback

## Database Schema

The sync uses the following database tables:

- `google_calendar_sync` - Stores OAuth tokens and sync settings
- `calendar_events` - Stores synchronized calendar events

## Security Notes

- All OAuth tokens are encrypted at rest
- Refresh tokens are stored securely and used automatically
- Access tokens have limited scope (calendar read/write only)
- State parameter is used to prevent CSRF attacks

## Support

If you encounter any issues, please check:
1. The browser developer console for errors
2. The server logs for detailed error messages
3. The Google Cloud Console for API quota issues