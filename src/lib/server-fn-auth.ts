/**
 * Helper to call TanStack server functions with the current Supabase
 * access token forwarded as an Authorization header. The
 * `requireSupabaseAuth` middleware reads this header to identify the user.
 */
import { supabase } from "@/integrations/supabase/client";

type ServerFn<TInput, TOutput> = (args: {
  data: TInput;
  headers?: Record<string, string>;
}) => Promise<TOutput>;

export async function callWithAuth<TInput, TOutput>(
  fn: ServerFn<TInput, TOutput>,
  data: TInput,
): Promise<TOutput> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("You must be signed in.");
  return fn({
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
}
