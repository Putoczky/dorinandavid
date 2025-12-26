/**
 * Shared types for the API
 * These can be imported in both the worker and the client
 */
import { z } from 'zod';
export declare const GuestSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    surname: z.ZodOptional<z.ZodString>;
    familyId: z.ZodOptional<z.ZodString>;
    attending: z.ZodOptional<z.ZodBoolean>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    dietaryRestrictions: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    submittedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Guest = z.infer<typeof GuestSchema>;
export declare const VerifyNameRequestSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const RSVPRequestSchema: z.ZodObject<{
    guestId: z.ZodString;
    attending: z.ZodOptional<z.ZodBoolean>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    dietaryRestrictions: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, z.core.$strip>;
export declare const VerifyNameResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    found: z.ZodBoolean;
    guest: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        surname: z.ZodOptional<z.ZodString>;
        familyId: z.ZodOptional<z.ZodString>;
        attending: z.ZodOptional<z.ZodBoolean>;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        dietaryRestrictions: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        submittedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    familyMembers: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        surname: z.ZodOptional<z.ZodString>;
        familyId: z.ZodOptional<z.ZodString>;
        attending: z.ZodOptional<z.ZodBoolean>;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        dietaryRestrictions: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        submittedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const RSVPResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    guest: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        surname: z.ZodOptional<z.ZodString>;
        familyId: z.ZodOptional<z.ZodString>;
        attending: z.ZodOptional<z.ZodBoolean>;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        dietaryRestrictions: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        submittedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const GuestsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    guests: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        surname: z.ZodOptional<z.ZodString>;
        familyId: z.ZodOptional<z.ZodString>;
        attending: z.ZodOptional<z.ZodBoolean>;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        dietaryRestrictions: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        submittedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    found: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type VerifyNameRequest = z.infer<typeof VerifyNameRequestSchema>;
export type RSVPRequest = z.infer<typeof RSVPRequestSchema>;
export type VerifyNameResponse = z.infer<typeof VerifyNameResponseSchema>;
export type RSVPResponse = z.infer<typeof RSVPResponseSchema>;
export type GuestsResponse = z.infer<typeof GuestsResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
//# sourceMappingURL=types.d.ts.map