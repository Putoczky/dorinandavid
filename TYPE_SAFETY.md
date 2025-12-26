# Type-Safe API Guide

This project uses **Hono** with **Zod** for end-to-end type safety between the Cloudflare Worker and the client.

## Architecture

```
Client (TypeScript) → Type-Safe API Client → Cloudflare Worker (Hono + Zod) → Airtable
```

## Benefits

✅ **End-to-end type safety**: Types are shared between client and server  
✅ **Runtime validation**: Zod validates all requests and responses  
✅ **Auto-completion**: Full TypeScript IntelliSense in your IDE  
✅ **Compile-time errors**: Catch type mismatches before runtime  
✅ **No code generation**: Types are inferred from Zod schemas  

## How It Works

### 1. Shared Types (`worker/types.ts`)

All API types are defined using Zod schemas:

```typescript
export const VerifyNameRequestSchema = z.object({
	name: z.string().min(1, 'Name is required'),
});

export type VerifyNameRequest = z.infer<typeof VerifyNameRequestSchema>;
```

### 2. Worker Routes (`worker/index.ts`)

Hono routes use Zod validators for automatic validation:

```typescript
app.post(
	'/verify-name',
	zValidator('json', VerifyNameRequestSchema),
	async (c) => {
		const { name } = c.req.valid('json') as VerifyNameRequest;
		// TypeScript knows `name` is a string
	}
);
```

### 3. Type-Safe Client (`src/lib/api-client.ts`)

The client uses the same types:

```typescript
import { verifyName } from '@/lib/api-client';
import type { VerifyNameResponse } from '@/lib/api-client';

// Full type safety!
const result: VerifyNameResponse = await verifyName('John Smith');
// TypeScript knows the exact shape of `result`
```

## Usage Examples

### Verifying a Name

```typescript
import { verifyName } from '@/lib/api-client';

try {
	const result = await verifyName('John Smith');
	if (result.found) {
		console.log('Guest:', result.guest);
		console.log('Family members:', result.familyMembers);
	}
} catch (error) {
	// Type-safe error handling
	console.error(error.message);
}
```

### Submitting RSVP

```typescript
import { submitRSVP } from '@/lib/api-client';
import type { RSVPRequest } from '@/lib/api-client';

const request: RSVPRequest = {
	guestId: 'rec123',
	attending: true,
	email: 'john@example.com',
	phone: '+1234567890',
	dietaryRestrictions: 'Vegetarian',
	notes: 'Looking forward to it!',
};

const result = await submitRSVP(request);
console.log('Updated guest:', result.guest);
```

## Type Safety Features

### 1. Request Validation

Invalid requests are automatically rejected:

```typescript
// ❌ This will fail validation
await verifyName(''); // Error: "Name is required"

// ✅ This works
await verifyName('John Smith');
```

### 2. Response Types

All responses are typed:

```typescript
const result = await verifyName('John');
// TypeScript knows:
// - result.success: boolean
// - result.found: boolean
// - result.guest: Guest
// - result.familyMembers: Guest[]
```

### 3. Auto-completion

Your IDE will suggest available properties:

```typescript
const result = await verifyName('John');
result. // IDE suggests: success, found, guest, familyMembers
result.guest. // IDE suggests: id, name, surname, attending, etc.
```

## Adding New Endpoints

1. **Define the schema** in `worker/types.ts`:

```typescript
export const NewEndpointRequestSchema = z.object({
	field1: z.string(),
	field2: z.number(),
});

export type NewEndpointRequest = z.infer<typeof NewEndpointRequestSchema>;
```

2. **Add the route** in `worker/index.ts`:

```typescript
app.post(
	'/new-endpoint',
	zValidator('json', NewEndpointRequestSchema),
	async (c) => {
		const { field1, field2 } = c.req.valid('json') as NewEndpointRequest;
		// Implementation
	}
);
```

3. **Add the client function** in `src/lib/api-client.ts`:

```typescript
export async function newEndpoint(
	request: NewEndpointRequest
): Promise<NewEndpointResponse> {
	return apiRequest<NewEndpointResponse>('/new-endpoint', {
		method: 'POST',
		body: JSON.stringify(request),
	});
}
```

## Comparison: Hono vs tRPC

### Hono (Current Choice) ✅

- ✅ **Simpler**: Less setup, easier to understand
- ✅ **Lightweight**: Perfect for Cloudflare Workers
- ✅ **Fast**: Optimized for edge computing
- ✅ **Flexible**: Works with any client (not just TypeScript)
- ✅ **Zod integration**: Built-in validation

### tRPC (Alternative)

- ✅ **More powerful**: Full RPC-style API
- ✅ **Better DX**: Automatic client generation
- ❌ **More complex**: Requires more setup
- ❌ **Heavier**: More dependencies
- ❌ **Framework-specific**: Best with React/Next.js

For this project, **Hono is the better choice** because:
- It's simpler and faster
- Perfect for Cloudflare Workers
- Still provides full type safety
- Less overhead

## Troubleshooting

### Type Errors

If you see type errors, make sure:
1. Types are exported from `worker/types.ts`
2. Client imports from `src/lib/api-client.ts`
3. Both use the same Zod schemas

### Runtime Validation Errors

Zod will automatically return 400 errors for invalid requests. Check the error message for details.

### Missing Types

If TypeScript can't find types:
1. Check imports are correct
2. Ensure types are exported
3. Restart your TypeScript server

