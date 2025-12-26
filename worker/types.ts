/**
 * Shared types for the API
 * These can be imported in both the worker and the client
 */

import { z } from 'zod';

// Guest schema for validation
export const GuestSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	surname: z.string().optional(),
	familyId: z.string().optional(),
	attending: z.boolean().optional(),
	email: z.string().email().optional().or(z.literal('')),
	phone: z.string().optional().or(z.literal('')),
	dietaryRestrictions: z.string().optional().or(z.literal('')),
	notes: z.string().optional().or(z.literal('')),
	submittedAt: z.string().optional(),
});

export type Guest = z.infer<typeof GuestSchema>;

// Request schemas
export const VerifyNameRequestSchema = z.object({
	name: z.string().min(1, 'Name is required'),
});

export const RSVPRequestSchema = z.object({
	guestId: z.string().min(1, 'Guest ID is required'),
	attending: z.boolean().optional(),
	email: z.string().email().optional().or(z.literal('')),
	phone: z.string().optional().or(z.literal('')),
	dietaryRestrictions: z.string().optional().or(z.literal('')),
	notes: z.string().optional().or(z.literal('')),
});

// Response schemas
export const VerifyNameResponseSchema = z.object({
	success: z.boolean(),
	found: z.boolean(),
	guest: GuestSchema,
	familyMembers: z.array(GuestSchema),
});

export const RSVPResponseSchema = z.object({
	success: z.boolean(),
	guest: GuestSchema,
});

export const GuestsResponseSchema = z.object({
	success: z.boolean(),
	guests: z.array(GuestSchema),
});

export const ErrorResponseSchema = z.object({
	error: z.string(),
	found: z.boolean().optional(),
});

// Type exports
export type VerifyNameRequest = z.infer<typeof VerifyNameRequestSchema>;
export type RSVPRequest = z.infer<typeof RSVPRequestSchema>;
export type VerifyNameResponse = z.infer<typeof VerifyNameResponseSchema>;
export type RSVPResponse = z.infer<typeof RSVPResponseSchema>;
export type GuestsResponse = z.infer<typeof GuestsResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

