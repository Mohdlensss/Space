# Fix Gmail & Calendar API Errors

## The Error
```
Gmail API has not been used in project 861258557300 before or it is disabled.
```

## Solution

You need to enable the Gmail API and Calendar API in your Google Cloud Console.

### Steps:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/library?project=861258557300

2. **Enable Gmail API:**
   - Search for "Gmail API"
   - Click on it
   - Click the **"Enable"** button
   - Wait a few minutes for it to propagate

3. **Enable Calendar API:**
   - Search for "Google Calendar API"
   - Click on it
   - Click the **"Enable"** button
   - Wait a few minutes for it to propagate

4. **Alternative Direct Links:**
   - Gmail API: https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=861258557300
   - Calendar API: https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=861258557300

5. **After enabling:**
   - Wait 2-3 minutes for the APIs to activate
   - Refresh your Space app
   - Try logging in again or reconnecting Google

## Linear API

✅ **Already configured** - The Linear API key has been added to `.env.local`

Just restart your dev server:
```bash
npm run dev
```

## Quick Test

After enabling the APIs:
1. Go to `/integrations` in Space
2. Click "Reconnect Google" if needed
3. Calendar and Gmail widgets should work!

