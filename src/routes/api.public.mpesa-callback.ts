import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Safaricom M-Pesa STK Push callback receiver.
 * Public — Safaricom calls this with no auth. We verify by matching the
 * CheckoutRequestID against a `pending` row we previously created.
 *
 * Reference payload:
 * {
 *   "Body": {
 *     "stkCallback": {
 *       "MerchantRequestID": "...",
 *       "CheckoutRequestID": "ws_CO_...",
 *       "ResultCode": 0,
 *       "ResultDesc": "The service request is processed successfully.",
 *       "CallbackMetadata": { "Item": [{Name: "Amount", Value: 1}, ...] }
 *     }
 *   }
 * }
 */
export const Route = createFileRoute("/api/public/mpesa-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any = null;
        try {
          payload = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ ResultCode: 1, ResultDesc: "Invalid JSON" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        const cb = payload?.Body?.stkCallback;
        if (!cb) {
          return new Response(
            JSON.stringify({ ResultCode: 1, ResultDesc: "Missing stkCallback" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        const checkoutId: string | undefined = cb.CheckoutRequestID;
        const resultCode: number = Number(cb.ResultCode ?? 1);
        const resultDesc: string = String(cb.ResultDesc ?? "");
        const items: { Name: string; Value: any }[] = cb.CallbackMetadata?.Item ?? [];

        const get = (n: string) => items.find((i) => i.Name === n)?.Value;
        const receiptNo = get("MpesaReceiptNumber") as string | undefined;

        if (!checkoutId) {
          return new Response(
            JSON.stringify({ ResultCode: 1, ResultDesc: "No CheckoutRequestID" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        const status = resultCode === 0 ? "success" : resultCode === 1032 ? "cancelled" : "failed";

        const { data: tx, error: updErr } = await supabaseAdmin
          .from("mpesa_transactions")
          .update({
            result_code: resultCode,
            result_desc: resultDesc,
            mpesa_receipt_number: receiptNo ?? null,
            status,
            raw_callback: payload,
          })
          .eq("checkout_request_id", checkoutId)
          .select()
          .maybeSingle();

        if (updErr) {
          console.error("mpesa-callback update failed", updErr);
        }

        // If the cashier already created the sale row, mark it paid.
        if (tx?.sale_id && status === "success") {
          await supabaseAdmin
            .from("sales")
            .update({ status: "paid", payment_ref: receiptNo ?? null })
            .eq("id", tx.sale_id);
        }

        // Always 200 so Safaricom does not retry.
        return new Response(
          JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
