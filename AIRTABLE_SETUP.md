# Airtable Setup Guide

This project uses Airtable to store guest RSVP information. Follow these steps to set it up:

## 1. Create an Airtable Base

1. Go to [Airtable.com](https://airtable.com) and sign up/login
2. Create a new base (or use an existing one)
3. Create a table named **"Guests"** (exact name is important)

## 2. Set Up the Table Structure

Create the following fields in your "Guests" table:

| Field Name | Field Type | Notes |
|------------|------------|-------|
| Name | Single line text | Required - Full name or first name |
| Surname | Single line text | **Required** - Family name/surname for grouping family members |
| Family ID | Single line text | Optional - Alternative way to group family members |
| Attending | Checkbox | Default: checked |
| Email | Email | Optional |
| Phone | Phone number | Optional |
| Dietary Restrictions | Long text | Optional |
| Notes | Long text | Optional |
| Submitted At | Date | Auto-populated |

## 3. Get Your API Credentials

### API Key:
1. Go to [Airtable Account Settings](https://airtable.com/account)
2. Click on "Developer" or go to [Create Token](https://airtable.com/create/tokens)
3. Create a new token with the following scopes:
   - `data.records:read` (to read guest data)
   - `data.records:write` (to create/update guest data)
4. Copy the token - this is your `AIRTABLE_API_KEY`

### Base ID:
1. Go to your Airtable base
2. Click "Help" → "API documentation"
3. The Base ID is in the URL: `https://airtable.com/{BASE_ID}/api/docs`
4. Copy the Base ID - this is your `AIRTABLE_BASE_ID`

## 4. Configure the Cloudflare Worker

**⚠️ IMPORTANT**: The Airtable API key is now stored securely in a Cloudflare Worker, not in the Astro app. See `WORKER_SETUP.md` for detailed instructions.

The API key should be set as a Worker secret:
```bash
cd worker
wrangler secret put AIRTABLE_API_KEY
wrangler secret put AIRTABLE_BASE_ID
```

## 5. Configure the Astro App

Set the Worker URL in your environment variables:

Create a `.env` file in the project root:
```bash
PUBLIC_WORKER_URL=https://airtable-proxy.your-subdomain.workers.dev
```

**Important:** Never commit the `.env` file to git (it's already in `.gitignore`).

## 6. For Cloudflare Pages Deployment

When deploying to Cloudflare Pages:

1. **Deploy the Worker first** (see `WORKER_SETUP.md`)
2. Go to your Cloudflare Pages project
3. Navigate to Settings → Environment Variables
4. Add:
   - `PUBLIC_WORKER_URL` = your Worker URL (e.g., `https://airtable-proxy.your-subdomain.workers.dev`)
5. Make sure to add it for both "Production" and "Preview" environments

**Note**: The Airtable API key is stored in the Worker's secrets, not in Pages environment variables.

## Usage Examples

### Query Guests by Family

```javascript
// GET /api/guests/family/{familyId}
fetch('/api/guests/family/smith-123')
  .then(res => res.json())
  .then(data => console.log(data.guests));
```

### Get All Guests

```javascript
// GET /api/guests
fetch('/api/guests')
  .then(res => res.json())
  .then(data => console.log(data.guests));
```

### Verify Name and Get Family Members

```javascript
// POST /api/verify-name
fetch('/api/verify-name', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John Smith' })
})
  .then(res => res.json())
  .then(data => {
    if (data.found) {
      console.log('Family members:', data.familyMembers);
    }
  });
```

### Submit RSVP

The RSVP form on the website:
1. First asks for a name to verify it's in the guest list
2. If found, shows all family members (guests with the same surname)
3. Allows RSVP submission for each family member
4. Updates existing guest records (doesn't create duplicates)

## Benefits of Airtable

- ✅ **Non-technical friendly**: Easy spreadsheet-like interface
- ✅ **Free tier**: 1,200 records per base (plenty for 200 guests)
- ✅ **Real-time updates**: Changes sync immediately
- ✅ **Filtering & Views**: Create custom views for different needs
- ✅ **Collaboration**: Share with family members who need access
- ✅ **Mobile app**: Access guest list on the go

