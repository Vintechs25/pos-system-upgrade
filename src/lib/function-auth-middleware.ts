import { createMiddleware } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabase as browserSupabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const requireSupabaseAuthFromContext = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { data } = await browserSupabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("You must be signed in.");

    return next({
      sendContext: { supabaseAccessToken: token },
    });
  })
  .server(async ({ next, context }) => {
    const token = String((context as { supabaseAccessToken?: string }).supabaseAccessToken ?? "");
    if (!token) throw new Error("Unauthorized: No active session was provided.");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing backend authentication configuration.");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new Error("Unauthorized: Invalid session.");
    }

    return next({
      context: {
        supabase,
        userId: data.claims.sub,
        claims: data.claims,
      },
    });
  });