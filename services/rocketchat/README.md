# DOO Space - Rocket.Chat Integration

This directory contains the Docker Compose configuration for running Rocket.Chat as the messaging backbone for DOO Space.

## Quick Start

```bash
# Start Rocket.Chat
docker compose up -d

# Check logs
docker compose logs -f rocketchat

# Stop services
docker compose down
```

## Access

- **URL**: http://localhost:3100
- **Default Admin**: Configured during first-run setup wizard

## First-Time Setup

1. Open http://localhost:3100
2. Complete the setup wizard:
   - Admin username: `doo_admin`
   - Admin email: `admin@doo.ooo`
   - Organization: `DOO`
3. Configure Google OAuth (see below)
4. Disable registration forms

## Google OAuth Configuration

To restrict access to @doo.ooo accounts:

1. Go to **Admin** → **OAuth** → **Google**
2. Enable Google OAuth
3. Configure with your Google Cloud Console credentials:
   - Client ID: Same as Space app
   - Client Secret: Same as Space app
   - Callback URL: `http://localhost:3100/_oauth/google`
4. Set **Hosted Domain** to: `doo.ooo`
5. Save

## Disable Other Login Methods

1. Go to **Admin** → **Accounts**
2. Set **Registration Form** to `Disabled`
3. Disable all login methods except Google OAuth

## DOO Theme Customization

1. Go to **Admin** → **Layout** → **Colors**
2. Set primary color to DOO purple: `#7C3AED`
3. Enable dark theme if desired

## Volume Data

Data is persisted in Docker volumes:
- `rocketchat_uploads` - File uploads
- `rocketchat_mongo` - MongoDB data
- `rocketchat_mongo_configdb` - MongoDB config

## Troubleshooting

### Service won't start
```bash
# Check MongoDB health
docker compose logs mongo

# Restart services
docker compose restart
```

### Reset everything
```bash
docker compose down -v  # Warning: Deletes all data!
docker compose up -d
```

