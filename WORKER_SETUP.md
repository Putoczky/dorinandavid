# Cloudflare Worker Setup Guide

This project uses a Cloudflare Worker to securely proxy Airtable API requests. The API key is stored in the Worker's secrets and never exposed to the client.

## Architecture

```
Client (Browser) → Astro API Routes → Cloudflare Worker → Airtable API
```

The Worker acts as a secure proxy, keeping your Airtable API key safe.

## Setup Steps

### 1. Install Wrangler CLI (if not already installed)

```bash
pnpm add -D wrangler @cloudflare/workers-types
```

### 2. Deploy the Worker

1. Navigate to the worker directory:
```bash
cd worker
```

2. Set the Worker secrets (API key and Base ID):
```bash
wrangler secret put AIRTABLE_API_KEY
# Paste your Airtable API key when prompted

wrangler secret put AIRTABLE_BASE_ID
# Paste your Airtable Base ID when prompted
```

3. Deploy the worker:
```bash
wrangler deploy
```

Or from the project root:
```bash
pnpm worker:deploy
```

After deployment, you'll get a Worker URL like: `https://airtable-proxy.your-subdomain.workers.dev`

### 3. Configure the Astro App

Set the Worker URL as an environment variable. You have two options:

#### Option A: Environment Variable (Recommended)

Create a `.env` file in the project root:
```bash
PUBLIC_WORKER_URL=https://airtable-proxy.your-subdomain.workers.dev
```

For Cloudflare Pages, add this in the dashboard:
1. Go to your Pages project
2. Settings → Environment Variables
3. Add `PUBLIC_WORKER_URL` with your Worker URL

#### Option B: Use Service Binding (Advanced)

If you want to use Cloudflare's service binding feature, you can bind the Worker directly to your Pages project. This requires additional configuration in `wrangler.toml`.

### 4. Local Development

For local development, you can run the worker locally:

```bash
# Terminal 1: Run the worker
pnpm worker:dev

# Terminal 2: Run Astro (update PUBLIC_WORKER_URL to http://localhost:8787)
pnpm dev
```

Update your `.env` for local development:
```bash
PUBLIC_WORKER_URL=http://localhost:8787
```

## Worker Endpoints

The Worker exposes the following endpoints:

- `POST /verify-name` - Verify a guest name and get family members
- `POST /rsvp` - Update a guest's RSVP
- `GET /guests` - Get all guests
- `GET /guests/family/:familyId` - Get guests by family ID

All endpoints return JSON and include CORS headers.

## Security Benefits

✅ **API Key Protection**: The Airtable API key is stored in Cloudflare Worker secrets and never exposed
✅ **Server-Side Only**: All Airtable requests go through the Worker
✅ **CORS Protection**: Worker handles CORS headers appropriately
✅ **Rate Limiting**: Can be added to the Worker if needed

## Troubleshooting

### Worker not responding

1. Check that the Worker is deployed: `wrangler deployments list`
2. Verify secrets are set: `wrangler secret list`
3. Check Worker logs: `wrangler tail`

### CORS errors

The Worker includes CORS headers. If you see CORS errors, verify:
1. The Worker URL is correct
2. The Worker is deployed and accessible
3. The `PUBLIC_WORKER_URL` environment variable is set correctly

### API Key errors

If you get authentication errors:
1. Verify the API key is set: `wrangler secret list`
2. Check that the API key has the correct scopes in Airtable
3. Ensure the Base ID matches your Airtable base

