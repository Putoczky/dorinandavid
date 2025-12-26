/**
 * Cloudflare Worker to proxy Airtable API requests
 * This keeps the Airtable API key secure and never exposed to the client
 * Uses Hono for type-safe routing and Zod for validation
 */
import { Hono } from 'hono';
export interface Env {
    AIRTABLE_API_KEY: string;
    AIRTABLE_BASE_ID: string;
}
type HonoEnv = {
    Bindings: Env;
};
declare const app: Hono<HonoEnv, import("hono/types").BlankSchema, "/">;
export default app;
export type AppType = typeof app;
//# sourceMappingURL=index.d.ts.map