import { createBrowserClient } from "@supabase/ssr"

// Browser Supabase client. Uses @supabase/ssr so the auth session is stored in
// cookies (not just localStorage), which lets middleware and server routes read
// the authenticated user for real route protection.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
