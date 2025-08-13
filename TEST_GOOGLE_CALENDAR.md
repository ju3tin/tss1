# Testing Google Calendar Sync

## Issue Resolution Summary

The 403 error you encountered was caused by a UI/UX issue where the Google Calendar sync button was not properly configured to initiate the OAuth flow. This has been fixed by:

1. **Created a proper Google Sync Button** for the header
2. **Added the Google Calendar Sync Card** to the main content area
3. **Fixed the OAuth flow** to properly redirect to Google authentication
4. **Updated the component structure** to separate button functionality from detailed sync controls

## How to Test Google Calendar Sync

### Step 1: Navigate to Calendar Page
- Go to `http://localhost:3000/calendar`
- Make sure you're logged in (if not, you'll be redirected to login)

### Step 2: Locate Google Calendar Components
You should now see:
- **Header Button**: "Sync Google" button in the top right corner
- **Sync Card**: A detailed Google Calendar sync card in the main content area with:
  - Toggle switch for enabling/disabling sync
  - Connection status
  - Sync features list
  - Setup instructions

### Step 3: Initiate Google OAuth
**Method 1: Using the Header Button**
1. Click the "Sync Google" button in the header
2. You'll be redirected to Google for authentication
3. Grant permission to access your Google Calendar
4. You'll be redirected back to the calendar page

**Method 2: Using the Sync Card**
1. Scroll down to the "Google Calendar Sync" card
2. Toggle the switch to enable sync
3. You'll be redirected to Google for authentication
4. Grant permission to access your Google Calendar
5. You'll be redirected back to the calendar page

### Step 4: Verify Successful Connection
After successful authentication, you should see:
- ✅ Header button changes to "Synced"
- ✅ Sync card shows "Sync Enabled" with a green "Connected" badge
- ✅ Last sync timestamp appears
- ✅ "Sync Now" button becomes active
- ✅ Your Google Calendar events appear in the CRM calendar

### Step 5: Test Sync Functionality
1. **Manual Sync**: Click "Sync Now" in the sync card
2. **Event Creation**: Create a new event and verify it syncs to Google Calendar
3. **Check Google Calendar**: Open your Google Calendar to see synced events

## Troubleshooting

### If you still get 403 errors:

1. **Check Google Cloud Console Configuration**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to "APIs & Services" > "Credentials"
   - Find your OAuth 2.0 Client ID
   - Click "Edit OAuth Client"
   - Verify "Authorized redirect URIs" includes:
     ```
     http://localhost:3000/api/calendar/auth/google/callback
     ```

2. **Check API Enablement**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Ensure it's enabled

3. **Check Domain Verification**:
   - In Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
   - Ensure your app is published and verified
   - For development, you can use "Testing" mode

### Common Error Messages:

**"Google Calendar not configured"**:
- This means the OAuth tokens weren't stored properly
- Try disconnecting and reconnecting
- Check the server logs for detailed errors

**"Unauthorized"**:
- Make sure you're logged into the CRM application
- Check that your session is valid

**"Redirect URI mismatch"**:
- The redirect URI in Google Cloud Console doesn't match exactly
- Check for trailing slashes or http vs https differences

### Debug Steps:

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for JavaScript errors in the Console tab
   - Check Network tab for failed requests

2. **Check Server Logs**:
   - Run `tail -f /home/z/my-project/dev.log` to see real-time logs
   - Look for OAuth or Google Calendar API errors

3. **Test OAuth Flow Manually**:
   - Visit `http://localhost:3000/api/calendar/auth/google` directly
   - See if you get redirected to Google properly

## Expected Behavior

### Successful Flow:
1. Click "Sync Google" → Redirect to Google
2. Grant permissions → Redirect back to CRM
3. See "Connected" status
4. Events appear from Google Calendar
5. Can create new events that sync to Google

### If Issues Persist:
1. Clear browser cookies and try again
2. Check that Google OAuth credentials are correct in `.env`
3. Verify Google Cloud Console configuration
4. Check that the Google Calendar API is enabled

## Support

If you continue to experience issues:
1. Check the browser console for errors
2. Check the server logs (`/home/z/my-project/dev.log`)
3. Verify all steps in the setup guide
4. Ensure Google Cloud Console is properly configured

The Google Calendar sync should now work properly with the corrected UI flow! 🎉