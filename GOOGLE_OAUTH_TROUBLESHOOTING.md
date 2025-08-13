# Google OAuth 403 Error Troubleshooting Guide

## Issue Analysis

The 403 error you're experiencing is occurring during the Google OAuth authentication flow. Based on my investigation, your local configuration is correct, but there's likely a mismatch or configuration issue in your Google Cloud Console setup.

## Verified Working Configuration ✅

Your local setup is correctly configured:
- ✅ Environment variables are set (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- ✅ Redirect URI is correct: `http://localhost:3000/api/calendar/auth/google/callback`
- ✅ OAuth flow is properly implemented
- ✅ Server endpoints are working

## Common Causes of 403 Errors

### 1. Redirect URI Mismatch (Most Common)
**Issue**: The redirect URI in Google Cloud Console doesn't exactly match what's in your application.

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID (should start with `776991072379-ep8uv2sj9cu3c2shqaaarofcu851ivc8.apps.googleusercontent.com`)
4. Click **Edit OAuth Client**
5. Under **Authorized redirect URIs**, add this EXACT URI:
   ```
   http://localhost:3000/api/calendar/auth/google/callback
   ```
6. Click **Save**

### 2. Google Calendar API Not Enabled
**Issue**: The Google Calendar API is not enabled for your project.

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Library**
3. Search for "Google Calendar API"
4. Click **Enable**
5. Wait a few minutes for the API to be fully enabled

### 3. OAuth Consent Screen Configuration
**Issue**: The OAuth consent screen is not properly configured.

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **OAuth consent screen**
3. Make sure the consent screen is **Published** (not in draft)
4. For development, you can use **Testing** mode
5. Add your email address as a **Test user**
6. Fill in the required fields:
   - App name: "CRM Calendar Sync" (or similar)
   - User support email: your email
   - Developer contact information: your email
7. Click **Save and Continue**

### 4. Domain Verification Issues
**Issue**: For production use, Google requires domain verification, but this shouldn't affect localhost development.

**Solution**:
- For development (localhost), this shouldn't be an issue
- If you're using a custom domain, you may need to verify it

### 5. Client ID/Secret Issues
**Issue**: The Client ID or Secret is incorrect or revoked.

**Solution**:
1. Verify your Client ID matches: `776991072372379-ep8uv2sj9cu3c2shqaaarofcu851ivc8.apps.googleusercontent.com`
2. If needed, regenerate the Client Secret in Google Cloud Console
3. Update your `.env` file with the new secret

## Step-by-Step Fix

### Step 1: Verify Redirect URI
1. Go to Google Cloud Console
2. APIs & Services > Credentials
3. Click on your OAuth 2.0 Client ID
4. Check "Authorized redirect URIs"
5. Ensure this exact URI is listed:
   ```
   http://localhost:3000/api/calendar/auth/google/callback
   ```

### Step 2: Enable Google Calendar API
1. Go to APIs & Services > Library
2. Search for "Google Calendar API"
3. Click "Enable" if not already enabled

### Step 3: Configure OAuth Consent Screen
1. Go to APIs & Services > OAuth consent screen
2. Select "External" user type
3. Fill in required information
4. Add scopes (these will be requested automatically):
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
5. Add test users (including your email)
6. Set to "Testing" mode for development

### Step 4: Test the Flow
1. Clear your browser cookies for localhost:3000
2. Go to `http://localhost:3000/calendar`
3. Log in to your CRM account
4. Click "Sync Google" button
5. You should be redirected to Google for authentication
6. Grant permissions
7. You should be redirected back to the calendar page

## Debug Commands

### Check Environment Variables
```bash
curl -s http://localhost:3000/api/debug/google-oauth
```

### Test OAuth URL Generation (requires authentication)
This endpoint requires you to be logged in first. Navigate to:
```
http://localhost:3000/api/debug/oauth-url
```

### Check Server Logs
```bash
tail -f /home/z/my-project/dev.log
```

## Expected Behavior After Fix

1. Click "Sync Google" → Redirect to Google
2. See Google's OAuth consent screen
3. Grant permissions → Redirect back to CRM
4. See "Connected" status in sync card
5. Events from Google Calendar appear in CRM

## If Issues Persist

### Clear Browser Data
1. Clear browser cookies and cache for localhost:3000
2. Try incognito/private browsing mode

### Check Browser Console
1. Open Developer Tools (F12)
2. Look for errors in Console tab
3. Check Network tab for failed requests

### Regenerate OAuth Credentials
1. In Google Cloud Console, create new OAuth credentials
2. Update `.env` file with new Client ID and Secret
3. Update authorized redirect URIs

### Test with Different Google Account
Try using a different Google account to rule out account-specific issues.

## Contact Support

If you continue to have issues after following these steps:
1. Take screenshots of your Google Cloud Console configuration
2. Check browser console for specific error messages
3. Review server logs for detailed error information
4. Provide the exact error message you're seeing

The most common fix is ensuring the redirect URI in Google Cloud Console matches exactly what's configured in the application.