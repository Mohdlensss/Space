# Space — DOO Internal Operating System

Space is DOO's internal nervous system. It knows who you are, what you should focus on, and what matters today.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Realtime, Storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (already configured)
- Google Cloud project with OAuth 2.0 credentials

### Installation

```bash
cd doo-space
npm install
```

### Environment Variables

Create a `.env.local` file (already created):

```env
NEXT_PUBLIC_SUPABASE_URL=https://voeybiqhgrvyntiwgeez.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Supabase Setup

### 1. Run Database Migrations

In the Supabase SQL Editor, run the migrations in order:

1. `supabase/migrations/001_initial_schema.sql` - Creates tables and RLS policies
2. `supabase/migrations/002_seed_profiles.sql` - Seeds DOO team members

### 2. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `avatars`
3. Set it to **Public**
4. Add policy for authenticated users to upload to their own folder:

```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 3. Configure Google OAuth Provider

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret

**Google Cloud Console Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable these APIs:
   - Gmail API
   - Google Calendar API
4. Go to OAuth consent screen:
   - App name: `Space`
   - User support email: your email
   - Authorized domains: `supabase.co`, your Vercel domain
   - Scopes: Add `gmail.readonly` and `calendar.readonly`
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://voeybiqhgrvyntiwgeez.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local dev)

### 4. Configure OAuth Scopes in Supabase

In the Google provider settings, add additional scopes:

```
openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly
```

**Important Settings:**
- Enable "Request offline access" (`access_type=offline`)
- Set prompt to `consent` initially to ensure refresh token is granted

## Architecture

### Auth Flow

1. User clicks "Sign in with Google" on `/login`
2. Supabase Auth redirects to Google with extended scopes
3. User consents to Gmail + Calendar read access
4. Google redirects back to `/auth/callback`
5. Callback exchanges code for session
6. If new user → create profile from seeds → redirect to `/onboarding`
7. If existing user → redirect to `/home`

### Token Access Pattern

Google provider tokens (for Gmail/Calendar APIs) are stored in the Supabase session.

```typescript
// Server-side only! Never expose to client.
import { getGoogleTokens } from '@/lib/google/tokens'

const tokens = await getGoogleTokens()
// tokens.accessToken - Use for Google API calls
// tokens.refreshToken - For refreshing expired tokens
```

All Google API calls happen in server-side Route Handlers or Server Components.

### Security

- Only `@doo.ooo` emails allowed (enforced in middleware + DB trigger)
- Google tokens never exposed to client
- RLS policies protect all database tables
- Service role key only used server-side

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated app routes
│   │   ├── home/
│   │   ├── directory/
│   │   ├── messages/
│   │   ├── calendar/
│   │   ├── email/
│   │   └── settings/
│   ├── auth/
│   │   ├── callback/    # OAuth callback handler
│   │   └── error/       # Auth error page
│   ├── login/           # Public login page
│   ├── onboarding/      # New user onboarding
│   └── api/
│       └── google/      # Google API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── app-shell.tsx    # Main app layout
│   └── onboarding/      # Onboarding wizard
├── lib/
│   ├── supabase/        # Supabase client helpers
│   ├── google/          # Google API helpers
│   ├── auth.ts          # Auth utilities
│   └── database.types.ts
└── middleware.ts        # Auth + domain guard
```

## Design System

Space uses a deep purple, glassmorphic design language:

- **Theme**: Always dark
- **Primary**: Deep purple/violet
- **Glass effects**: Low opacity backgrounds with blur
- **Aesthetic**: Aerospace, calm, spacious

CSS utilities:
- `.glass` - Standard glass card
- `.glass-strong` - More opaque glass
- `.glass-subtle` - Lighter glass
- `.space-gradient` - Background gradient
- `.space-glow` - Glow effect

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Add your Vercel domain to Google OAuth authorized redirect URIs:
   - `https://your-app.vercel.app/auth/callback`
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel domain

## Development Roadmap

### Day 1 (Foundation) ✅
- [x] Project setup
- [x] Design system
- [x] Supabase Auth with Google OAuth
- [x] Extended scopes for Gmail/Calendar
- [x] Middleware auth guard
- [x] Database schema
- [x] Profile provisioning
- [x] Onboarding flow
- [x] App shell
- [x] Home, Directory pages

### Day 2 (Intelligence Layer)
- [ ] Linear integration
- [ ] Gmail reading (per-user)
- [ ] Calendar reading (per-user)
- [ ] Home page personalization

### Day 3 (Communication + HR)
- [ ] Messaging (channels, DMs, threads)
- [ ] Real-time with Supabase
- [ ] HR remote work requests
- [ ] Approval workflow

### Day 4 (Polish + Ship)
- [ ] Search
- [ ] Wellbeing game foundation
- [ ] Mobile polish
- [ ] Deploy to production

---

Built with urgency and intention for DOO.
