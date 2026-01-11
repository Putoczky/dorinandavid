# CI/CD Setup

This project uses GitHub Actions to automatically deploy both the worker and frontend to Cloudflare on merge to `main` or `master` branch.

## Required GitHub Secrets

To enable automatic deployment, you need to configure the following secrets in your GitHub repository:

1. **CLOUDFLARE_API_TOKEN**: Your Cloudflare API token with permissions to:
   - Deploy Workers
   - Deploy Pages
   - Read account information

2. **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare account ID

### How to get these values:

#### Cloudflare API Token:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template or create a custom token with:
   - Account: Workers Scripts:Edit
   - Account: Cloudflare Pages:Edit
   - Account: Account Settings:Read
4. Copy the generated token

#### Cloudflare Account ID:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. The Account ID is shown in the right sidebar under "Account ID"

### Setting up secrets in GitHub:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

## Workflow

The workflow (`.github/workflows/deploy.yml`) will:

1. Trigger on push to `main` or `master` branch (or manual trigger)
2. Install dependencies using pnpm
3. Build the frontend application
4. Deploy the worker to Cloudflare Workers
5. Deploy the frontend to Cloudflare Pages

## Manual Deployment

You can also trigger the workflow manually:
1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy" workflow
3. Click "Run workflow"

