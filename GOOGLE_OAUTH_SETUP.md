# Google OAuth Setup Guide for Space

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Name it something like "DOO Space" or "Space Internal OS"

### 1.2 Enable Required APIs
1. Go to **APIs & Services** → **Library**
2. Enable these APIs:
   - **Gmail API** (search "Gmail API" and click Enable)
   - **Google Calendar API** (search "Calendar API" and click Enable)

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **Internal** (if you have Google Workspace) or **External** (if not)
3. Fill in the required fields:
   - **App name**: `Space`
   - **User support email**: Your email (e.g., mohamed@doo.ooo)
   - **App logo**: (Optional - can add later)
   - **Application home page**: `https://your-vercel-app.vercel.app` (or localhost for now)
   - **Authorized domains**: Add:
     - `supabase.co`
     - Your Vercel domain (when ready)
4. Click **Save and Continue**

### 1.4 Add Scopes
1. On the **Scopes** screen, click **Add or Remove Scopes**
2. Filter and add these scopes:
   - `openid` (should already be there)
   - `email` (should already be there)
   - `profile` (should already be there)
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/calendar.readonly`
3. Click **Update** → **Save and Continue**
4. Skip the **Test users** step (not needed for internal apps) → **Save and Continue**
5. Review and **Back to Dashboard**

### 1.5 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name it: `Space - Supabase OAuth`
5. **Authorized redirect URIs** - Add these:
   ```
   https://voeybiqhgrvyntiwgeez.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
   (Add your Vercel domain later: `https://your-app.vercel.app/auth/callback`)
6. Click **Create**
7. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these in Supabase

## Step 2: Configure Supabase

### 2.1 Enable Google Provider in Supabase
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/voeybiqhgrvyntiwgeez/auth/providers
2. Find **Google** in the list and click **Enable**
3. Paste your **Client ID** and **Client Secret** from Step 1.5
4. In the **Additional Scopes** field, add:
   ```
   https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly
   ```
5. Scroll down to **Advanced Settings**:
   - Check ✅ **Request offline access** (this enables refresh tokens)
6. Click **Save**

### 2.2 Verify Redirect URI
Make sure your Supabase project's redirect URI matches what you added in Google Cloud:
- Supabase redirect URI: `https://voeybiqhgrvyntiwgeez.supabase.co/auth/v1/callback`
- This should match one of the Authorized redirect URIs in Google Cloud

## Step 3: Test the Flow

1. Go to http://localhost:3000/login
2. Click "Continue with Google"
3. You should see the OAuth consent screen asking for:
   - Basic profile info
   - Gmail read-only access
   - Calendar read-only access
4. After consenting, you should be redirected back and logged in

## Troubleshooting

**Error: redirect_uri_mismatch**
- Make sure the redirect URI in Google Cloud matches exactly: `https://voeybiqhgrvyntiwgeez.supabase.co/auth/v1/callback`
- No trailing slashes, exact match required

**Error: access_denied**
- Check that you enabled the Gmail API and Calendar API in Google Cloud Console
- Verify the scopes are added in the OAuth consent screen

**No refresh token received**
- Make sure "Request offline access" is checked in Supabase Google provider settings
- First-time consent should include `prompt=consent` (Supabase should handle this automatically)

**User sees "App not verified"**
- For internal Google Workspace apps, this is normal - users can still proceed
- For external apps, you may need to publish (not required for internal testing)

