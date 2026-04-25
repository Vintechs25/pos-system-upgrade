/**
 * Helper to call TanStack server functions with the current Supabase
 * access token forwarded as an Authorization header. The
 * `requireSupabaseAuth` middleware reads this header to identify the user.
 */
import { supabase } from "@/integrations/supabase/client";

type ServerFn<TInput, TOutput> = (args: {
  data: TInput;
  headers?: HeadersInit;
  fetch?: typeof fetch;
}) => Promise<TOutput>;

export async function callWithAuth<TInput, TOutput>(
  fn: ServerFn<TInput, TOutput>,
  data: TInput,
): Promise<TOutput> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("You must be signed in.");
  const authorization = `Bearer ${token}`;
  const fetchWithAuth: typeof fetch = async (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("authorization", authorization);
    return fetch(input, { ...init, headers });
  };
  try {
    return await fn({
      data,
      headers: { authorization },
      fetch: fetchWithAuth,
    });
  } catch (err) {
    // The auth middleware throws a `Response` on failure, which surfaces as
    // "[object Response]" by default. Extract the real message from it.
    if (err instanceof Response) {
      let body = "";
      try {
        body = await err.text();
      } catch {
        body = "";
      }
      throw new Error(body || `Server error (${err.status})`);
    }
    throw err;
  }
}
