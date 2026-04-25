/**
 * Helper to call protected TanStack server functions and normalize errors.
 * Auth is attached by the function middleware in `function-auth-middleware`.
 */

type ServerFn<TInput, TOutput> = (args: {
  data: TInput;
}) => Promise<TOutput>;

export async function callWithAuth<TInput, TOutput>(
  fn: ServerFn<TInput, TOutput>,
  data: TInput,
): Promise<TOutput> {
  try {
    return await fn({ data });
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
