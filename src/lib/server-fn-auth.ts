/**
 * Helper to call protected TanStack server functions and normalize errors.
 * The access token is included in the server-function payload because this
 * TanStack Start build is not forwarding custom call-site headers reliably.
 */
import { supabase } from "@/integrations/supabase/client";

type ServerFn<TInput, TOutput> = (args: {
  data: TInput & { __authToken: string };
}) => Promise<TOutput>;

export async function callWithAuth<TInput, TOutput>(
  fn: ServerFn<TInput, TOutput>,
  data: TInput,
): Promise<TOutput> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("You must be signed in.");

  try {
    return await fn({ data: { ...data, __authToken: token } });
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
