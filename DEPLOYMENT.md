# Deploying DOO Space to Netlify

## Domain: doo.space

---

## Step 1: Connect Repository

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select `Mohdlensss/Space`
4. Branch: `main`

---

## Step 2: Build Settings

Netlify should auto-detect these from `netlify.toml`, but verify:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | `20` |

---

## Step 3: Environment Variables

Add these in Netlify Dashboard → Site Settings → Environment Variables:

### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_APP_URL=https://doo.space
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
LINEAR_API_KEY=<your-linear-api-key>
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_CHAT_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

**Note**: Get actual values from your `.env.local` file or team admin.

---

## Step 4: Domain Setup

1. Go to Site Settings → Domain Management
2. Add custom domain: `doo.space`
3. Configure DNS:

### DNS Records (at your domain registrar)

| Type | Name | Value |
|------|------|-------|
| A | @ | 75.2.60.5 |
| CNAME | www | your-site-name.netlify.app |

Or use Netlify DNS by updating nameservers.

---

## Step 5: Google OAuth Redirect URIs

**IMPORTANT**: Update Google Cloud Console with production redirect URI.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client
4. Add Authorized redirect URI:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```

---

## Step 6: Supabase Auth Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update Site URL to: `https://doo.space`
3. Add Redirect URLs:
   ```
   https://doo.space/auth/callback
   https://doo.space/**
   ```

---

## Step 7: Deploy!

1. Click "Deploy site" in Netlify
2. Wait for build (2-3 minutes)
3. Visit https://doo.space

---

## Troubleshooting

### Build Fails
- Check Node version is 20
- Ensure all env vars are set

### Auth Redirect Loop
- Verify Supabase Site URL matches production domain
- Check redirect URIs in Google Cloud Console

### API Errors
- Verify OPENAI_API_KEY is set
- Check LINEAR_API_KEY is valid

---

## Post-Deploy Checklist

- [ ] Site loads at doo.space
- [ ] Google login works
- [ ] Ask Space responds
- [ ] Calendar shows events
- [ ] Linear tasks display
- [ ] Approvals appear for managers

---

**Ready to launch! 🚀**
