/**
 * Cloudflare Worker to proxy Airtable API requests
 * This keeps the Airtable API key secure and never exposed to the client
 * Uses Hono for type-safe routing and Zod for validation
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { VerifyNameRequestSchema, RSVPRequestSchema, } from './types';
const app = new Hono();
// CORS middleware
app.use('*', cors());
const TABLE_NAME = 'Guests';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
async function airtableRequest(env, method, endpoint, body) {
    const url = `${AIRTABLE_API_BASE}/${env.AIRTABLE_BASE_ID}/${endpoint}`;
    const headers = {
        Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
    };
    const options = {
        method,
        headers,
    };
    if (body && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }
    return fetch(url, options);
}
function mapAirtableRecord(record) {
    return {
        id: record.id,
        name: record.fields.Name,
        surname: record.fields.Surname || undefined,
        familyId: record.fields['Family ID'] || undefined,
        attending: record.fields.Attending ?? true,
        email: record.fields.Email || undefined,
        phone: record.fields.Phone || undefined,
        dietaryRestrictions: record.fields['Dietary Restrictions'] || undefined,
        notes: record.fields.Notes || undefined,
        submittedAt: record.fields['Submitted At'] || undefined,
    };
}
// POST /verify-name - Verify a guest name and get family members
app.post('/verify-name', zValidator('json', VerifyNameRequestSchema), async (c) => {
    const env = c.env;
    const { name } = c.req.valid('json');
    try {
        // Find guest by name
        const searchUrl = `${TABLE_NAME}?filterByFormula=${encodeURIComponent(`SEARCH(LOWER("${name.toLowerCase()}"), LOWER({Name}))`)}`;
        const searchResponse = await airtableRequest(env, 'GET', searchUrl);
        const searchData = (await searchResponse.json());
        if (!searchData.records || searchData.records.length === 0) {
            return c.json({ error: 'Name not found in guest list', found: false }, 404);
        }
        const guest = mapAirtableRecord(searchData.records[0]);
        let familyMembers = [];
        // Get family members by Family ID or Surname
        if (guest.familyId) {
            const familyUrl = `${TABLE_NAME}?filterByFormula=${encodeURIComponent(`{Family ID} = "${guest.familyId}"`)}`;
            const familyResponse = await airtableRequest(env, 'GET', familyUrl);
            const familyData = (await familyResponse.json());
            familyMembers = familyData.records?.map(mapAirtableRecord) || [];
        }
        else if (guest.surname) {
            const surnameUrl = `${TABLE_NAME}?filterByFormula=${encodeURIComponent(`{Surname} = "${guest.surname}"`)}`;
            const surnameResponse = await airtableRequest(env, 'GET', surnameUrl);
            const surnameData = (await surnameResponse.json());
            familyMembers = surnameData.records?.map(mapAirtableRecord) || [];
        }
        else {
            familyMembers = [guest];
        }
        const response = {
            success: true,
            found: true,
            guest,
            familyMembers,
        };
        return c.json(response);
    }
    catch (error) {
        console.error('Error verifying name:', error);
        return c.json({ error: error instanceof Error ? error.message : 'Failed to verify name' }, 500);
    }
});
// POST /rsvp - Update a guest's RSVP
app.post('/rsvp', zValidator('json', RSVPRequestSchema), async (c) => {
    const env = c.env;
    const { guestId, attending, email, phone, dietaryRestrictions, notes } = c.req.valid('json');
    try {
        const fields = {};
        if (attending !== undefined)
            fields.Attending = attending;
        if (email !== undefined && email !== '')
            fields.Email = email;
        if (phone !== undefined && phone !== '')
            fields.Phone = phone;
        if (dietaryRestrictions !== undefined && dietaryRestrictions !== '')
            fields['Dietary Restrictions'] = dietaryRestrictions;
        if (notes !== undefined && notes !== '')
            fields.Notes = notes;
        fields['Submitted At'] = new Date().toISOString();
        const updateResponse = await airtableRequest(env, 'PATCH', TABLE_NAME, {
            records: [
                {
                    id: guestId,
                    fields,
                },
            ],
        });
        if (!updateResponse.ok) {
            const errorData = (await updateResponse.json());
            throw new Error(errorData.error?.message || 'Failed to update guest');
        }
        const updateData = (await updateResponse.json());
        if (!updateData.records || updateData.records.length === 0) {
            throw new Error('No records returned from update');
        }
        const updatedGuest = mapAirtableRecord(updateData.records[0]);
        const response = {
            success: true,
            guest: updatedGuest,
        };
        return c.json(response);
    }
    catch (error) {
        console.error('Error updating guest:', error);
        return c.json({ error: error instanceof Error ? error.message : 'Failed to update guest' }, 500);
    }
});
// GET /guests - Get all guests
app.get('/guests', async (c) => {
    const env = c.env;
    try {
        const response = await airtableRequest(env, 'GET', TABLE_NAME);
        const data = (await response.json());
        const guests = data.records?.map(mapAirtableRecord) || [];
        const apiResponse = {
            success: true,
            guests,
        };
        return c.json(apiResponse);
    }
    catch (error) {
        console.error('Error fetching guests:', error);
        return c.json({ error: error instanceof Error ? error.message : 'Failed to fetch guests' }, 500);
    }
});
// GET /guests/family/:familyId - Get guests by family ID
app.get('/guests/family/:familyId', async (c) => {
    const env = c.env;
    const familyId = c.req.param('familyId');
    if (!familyId) {
        return c.json({ error: 'Family ID is required' }, 400);
    }
    try {
        const familyUrl = `${TABLE_NAME}?filterByFormula=${encodeURIComponent(`{Family ID} = "${familyId}"`)}`;
        const response = await airtableRequest(env, 'GET', familyUrl);
        const data = (await response.json());
        const guests = data.records?.map(mapAirtableRecord) || [];
        const apiResponse = {
            success: true,
            guests,
        };
        return c.json(apiResponse);
    }
    catch (error) {
        console.error('Error fetching guests by family:', error);
        return c.json({ error: error instanceof Error ? error.message : 'Failed to fetch guests' }, 500);
    }
});
export default app;
