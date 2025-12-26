/**
 * Type-safe API client for the Cloudflare Worker using Hono RPC
 * Uses Hono's RPC feature for end-to-end type safety with React Query
 * @see https://hono.dev/docs/guides/rpc
 * @see https://hono.dev/docs/concepts/stacks
 */

import { hc } from 'hono/client';
import type { InferRequestType } from 'hono/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AppType } from '../../worker/index';
import type {
	VerifyNameResponse,
	RSVPResponse,
	VerifyNameRequest,
	RSVPRequest,
} from '../../worker/types';

// Worker URL - must be set via PUBLIC_WORKER_URL environment variable
const WORKER_URL = import.meta.env.PUBLIC_WORKER_URL || '';

if (!WORKER_URL) {
	console.warn('PUBLIC_WORKER_URL is not set. API calls will fail.');
}

// Create the Hono RPC client
const client = hc<AppType>(WORKER_URL);

// Extract route handlers for type inference
const $verifyName = client['verify-name'].$post;
const $rsvp = client.rsvp.$post;

// React Query hooks for API operations

/**
 * Verify a guest name and get their family members
 */
export function useVerifyName() {
	const queryClient = useQueryClient();

	const mutation = useMutation<VerifyNameResponse, Response, VerifyNameRequest>({
		mutationFn: async (data): Promise<VerifyNameResponse> => {
			const res = await $verifyName({ json: data });
			// If res.ok is false, throw the response for onError to handle
			if (!res.ok) throw res;
			return res.json() as Promise<VerifyNameResponse>;
		},
	});

	return mutation;
}

/**
 * Update a guest's RSVP
 */
export function useSubmitRSVP() {
	const queryClient = useQueryClient();

	const mutation = useMutation<RSVPResponse, Response, RSVPRequest>({
		mutationFn: async (data): Promise<RSVPResponse> => {
			const res = await $rsvp({ json: data });
			// If res.ok is false, throw the response for onError to handle
			if (!res.ok) throw res;
			return res.json() as Promise<RSVPResponse>;
		},
	});

	return mutation;
}

/**
 * Get all guests
 */
export function useAllGuests() {
	return useQuery({
		queryKey: ['guests'],
		queryFn: async () => {
			const res = await client.guests.$get();
			if (!res.ok) {
				// Throw the response so onError can handle it
				throw res;
			}
			return res.json();
		},
	});
}

/**
 * Get guests by family ID
 */
export function useGuestsByFamily(familyId: string) {
	return useQuery({
		queryKey: ['guests', 'family', familyId],
		queryFn: async () => {
			const res = await client.guests.family[':familyId'].$get({
				param: { familyId },
			});
			if (!res.ok) {
				// Throw the response so onError can handle it
				throw res;
			}
			return res.json();
		},
		enabled: !!familyId,
	});
}

// Re-export types for convenience
export type {
	Guest,
	VerifyNameRequest,
	VerifyNameResponse,
	RSVPRequest,
	RSVPResponse,
	GuestsResponse,
} from '../../worker/types';
