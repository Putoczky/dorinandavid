/**
 * Cloudflare Worker to proxy Airtable API requests
 * This keeps the Airtable API key secure and never exposed to the client
 * Uses Hono for type-safe routing and Zod for validation
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import {
	GuestSchema,
	VerifyNameRequestSchema,
	RSVPRequestSchema,
	type Guest,
	type VerifyNameRequest,
	type VerifyNameResponse,
	type RSVPRequest,
	type RSVPResponse,
	type GuestsResponse,
} from './types';

export interface Env {
	AIRTABLE_API_KEY: string;
	AIRTABLE_BASE_ID: string;
}

type HonoEnv = {
	Bindings: Env;
};

const app = new Hono<HonoEnv>();

// CORS middleware
app.use('*', cors());

const TABLE_NAME = 'Guests';
const FAMILIES_TABLE_NAME = 'Families';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

async function airtableRequest(
	env: Env,
	method: string,
	endpoint: string,
	body?: any
): Promise<Response> {
	const url = `${AIRTABLE_API_BASE}/${env.AIRTABLE_BASE_ID}/${endpoint}`;

	const headers: HeadersInit = {
		Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
		'Content-Type': 'application/json',
	};

	const options: RequestInit = {
		method,
		headers,
	};

	if (body && (method === 'POST' || method === 'PATCH')) {
		options.body = JSON.stringify(body);
	}

	return fetch(url, options);
}

function mapAirtableRecord(record: any): Guest {
	return {
		id: record.id,
		name: (record.fields['Full name'] as string) || (record.fields.Name as string) || '',
		surname: (record.fields.Surname as string) || undefined,
		familyId: (record.fields['Family ID'] as string) || undefined,
		attending: (record.fields.Attending as boolean) ?? true,
		email: (record.fields.Email as string) || undefined,
		phone: (record.fields.Phone as string) || undefined,
		dietaryRestrictions: (record.fields['Dietary Restrictions'] as string) || undefined,
		notes: (record.fields.Notes as string) || undefined,
		submittedAt: (record.fields['Submitted At'] as string) || undefined,
		szertartas: (record.fields.Szertartas as boolean) ?? false,
		lakodalom: (record.fields.Lakodalom as boolean) ?? false,
		transfer: (record.fields.Transfer as boolean) ?? false,
	};
}

// POST /verify-name - Verify a guest name and get family members
const route = app.post(
	'/verify-name',
	zValidator('json', VerifyNameRequestSchema),
	async (c): Promise<Response> => {
		const env = c.env;
		const { name } = c.req.valid('json') as VerifyNameRequest;

		try {
			// Find guest by name - exact match on Full name column (case-insensitive)
			// Escape quotes in the name to prevent formula injection
			const escapedName = name.trim().replace(/"/g, '""');
			const searchUrl = `${TABLE_NAME}?filterByFormula=${encodeURIComponent(
				`LOWER({Full name}) = LOWER("${escapedName}")`
			)}`;
			const searchResponse = await airtableRequest(env, 'GET', searchUrl);
			const searchData = (await searchResponse.json()) as { records?: any[] };

			if (!searchData.records || searchData.records.length === 0) {
				return c.json(
					{ error: 'Sajnos ilyen nevű vendég nem található a listán', found: false },
					404
				);
			}

			const guestRecord = searchData.records[0];
			const guest = mapAirtableRecord(guestRecord);
			
			// Get family members from the Families table
			const familyRelation = guestRecord.fields['Family name'] as string[] | undefined;
			
			if (!familyRelation || familyRelation.length === 0) {
				throw new Error('Guest does not have a family relation');
			}
			
			const familyRecordId = familyRelation[0];
			
			// Get the family record from the Families table
			const familyRecordUrl = `${FAMILIES_TABLE_NAME}/${familyRecordId}`;
			const familyRecordResponse = await airtableRequest(env, 'GET', familyRecordUrl);
			
			if (!familyRecordResponse.ok) {
				const errorText = await familyRecordResponse.text();
				throw new Error(`Sajnos nem sikerült a család adatait lekérdezni: ${errorText}`);
			}
			
			const familyRecordData = (await familyRecordResponse.json()) as { fields?: any };
			const memberIds = familyRecordData.fields?.['Members'] as string[] | undefined;
			const familyEmail = (familyRecordData.fields?.['Email'] as string) || undefined;
			const familyNotes = (familyRecordData.fields?.['Notes'] as string) || undefined;
			
			if (!memberIds || memberIds.length === 0) {
				throw new Error('Sajnos a család tagjai nem találhatók a listán');
			}
			
			// Fetch all guest records using their IDs with OR() filter
			const recordIdFilters = memberIds.map(id => `RECORD_ID() = "${id}"`).join(', ');
			const guestFilter = `OR(${recordIdFilters})`;
			const guestsUrl = `${TABLE_NAME}?filterByFormula=${encodeURIComponent(guestFilter)}`;
			
			const guestsResponse = await airtableRequest(env, 'GET', guestsUrl);
			
			if (!guestsResponse.ok) {
				const errorText = await guestsResponse.text();
				throw new Error(`Failed to fetch guest records: ${errorText}`);
			}
			
			const guestsData = (await guestsResponse.json()) as { records?: any[] };
			if (!guestsData.records || guestsData.records.length === 0) {
				throw new Error('No guest records found for family members');
			}
			
			const familyMembers = guestsData.records.map(mapAirtableRecord);

			const response: VerifyNameResponse = {
				success: true,
				found: true,
				guest,
				familyMembers,
				familyEmail,
				familyId: familyRecordId,
				familyNotes,
			};

			return c.json(response);
		} catch (error) {
			console.error('Error verifying name:', error);
			return c.json(
				{ error: error instanceof Error ? error.message : 'Failed to verify name' },
				500
			);
		}
	}
) .post(
	'/rsvp',
	zValidator('json', RSVPRequestSchema),
	async (c): Promise<Response> => {
		const env = c.env;
		const { guestId, attending, email, phone, dietaryRestrictions, notes, szertartas, lakodalom, transfer, familyEmail, familyId, familyNotes } = c.req.valid('json') as RSVPRequest;

		try {
			const fields: Record<string, any> = {};
			if (szertartas !== undefined) fields.Szertartas = szertartas;
			if (lakodalom !== undefined) fields.Lakodalom = lakodalom;
			if (dietaryRestrictions !== undefined) fields['Dietary Restrictions'] = dietaryRestrictions;
			if (transfer !== undefined) fields.Transfer = transfer;

			// Update guest record
			const updateResponse = await airtableRequest(env, 'PATCH', TABLE_NAME, {
				records: [
					{
						id: guestId,
						fields,
					},
				],
			});

			if (!updateResponse.ok) {
				const errorData = (await updateResponse.json()) as { error?: { message?: string } };
				throw new Error(errorData.error?.message || 'Failed to update guest');
			}

			const updateData = (await updateResponse.json()) as { records?: any[] };
			if (!updateData.records || updateData.records.length === 0) {
				throw new Error('No records returned from update');
			}
			const updatedGuest = mapAirtableRecord(updateData.records[0]);

			// Update family email and notes if familyId is provided
			if (familyId) {
				const familyFields: Record<string, any> = {};
				if (familyEmail) {
					familyFields.Email = familyEmail;
				}
				if (familyNotes !== undefined) {
					familyFields.Notes = familyNotes;
				}

				if (Object.keys(familyFields).length > 0) {
					const familyUpdateResponse = await airtableRequest(env, 'PATCH', FAMILIES_TABLE_NAME, {
						records: [
							{
								id: familyId,
								fields: familyFields,
							},
						],
					});

					if (!familyUpdateResponse.ok) {
						console.error('Failed to update family data, but guest update succeeded');
						// Don't fail the whole request if family update fails
					}
				}
			}

			const response: RSVPResponse = {
				success: true,
				guest: updatedGuest,
			};

			return c.json(response);
		} catch (error) {
			console.error('Error updating guest:', error);
			return c.json(
				{ error: error instanceof Error ? error.message : 'Failed to update guest' },
				500
			);
		}
	}
).get('/guests', async (c): Promise<Response> => {
	const env = c.env;

	try {
		const response = await airtableRequest(env, 'GET', TABLE_NAME);
		const data = (await response.json()) as { records?: any[] };

		const guests = data.records?.map(mapAirtableRecord) || [];

		const apiResponse: GuestsResponse = {
			success: true,
			guests,
		};

		return c.json(apiResponse);
	} catch (error) {
		console.error('Error fetching guests:', error);
		return c.json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch guests' },
			500
		);
	}
}).get('/guests/family/:familyId', async (c): Promise<Response> => {
	const env = c.env;
	const familyId = c.req.param('familyId');

	if (!familyId) {
		return c.json({ error: 'Family ID is required' }, 400);
	}

	try {
		const familyUrl = `${TABLE_NAME}?filterByFormula=${encodeURIComponent(
			`{Family ID} = "${familyId}"`
		)}`;
		const response = await airtableRequest(env, 'GET', familyUrl);
		const data = (await response.json()) as { records?: any[] };

		const guests = data.records?.map(mapAirtableRecord) || [];

		const apiResponse: GuestsResponse = {
			success: true,
			guests,
		};

		return c.json(apiResponse);
	} catch (error) {
		console.error('Error fetching guests by family:', error);
		return c.json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch guests' },
			500
		);
	}
});

export default app;

// Export the app type for potential client-side type inference
export type AppType = typeof route;
