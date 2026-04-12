import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UDDOKTAPAY_API_KEY = Deno.env.get("UDDOKTAPAY_API_KEY")!;
const UDDOKTAPAY_BASE = "https://sandbox.uddoktapay.com/api";

const asObject = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const firstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const normalizedStatus = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");
const isCompleted = (value: unknown) => ["completed", "success", "successful", "paid"].includes(normalizedStatus(value));
const isFailed = (value: unknown) => ["failed", "cancelled", "canceled", "expired"].includes(normalizedStatus(value));

async function verifyPayment(invoiceId: string) {
  const verifyRes = await fetch(`${UDDOKTAPAY_BASE}/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  const data = await verifyRes.json();
  if (!verifyRes.ok) {
    throw new Error(`Verify payment failed: ${JSON.stringify(data)}`);
  }

  return data;
}

async function finalizeTransaction(supabaseAdmin: ReturnType<typeof createClient>, txn: any, invoiceId: string | null, verifyData: unknown) {
  const meta = asObject(txn.metadata);
  const txnType = firstString(txn.type, meta.type) || "payment";
  const nextMeta = {
    ...meta,
    type: txnType,
    verify_data: verifyData,
    finalized_at: new Date().toISOString(),
  };

  if (txn.status !== "processing") {
    await supabaseAdmin
      .from("transactions")
      .update({
        status: "processing",
        uddoktapay_invoice_id: invoiceId ?? txn.uddoktapay_invoice_id,
        metadata: nextMeta,
      })
      .eq("id", txn.id);
  }

  if (txnType === "add_money") {
    const { data: wallet } = await supabaseAdmin.from("wallets").select("*").eq("user_id", txn.user_id).maybeSingle();
    if (wallet) {
      await supabaseAdmin.from("wallets").update({ balance: Number(wallet.balance) + Number(txn.amount) }).eq("id", wallet.id);
    } else {
      await supabaseAdmin.from("wallets").insert({ user_id: txn.user_id, balance: Number(txn.amount) });
    }
  } else {
    const { data: existingOrder } = await supabaseAdmin.from("orders").select("id").eq("transaction_id", txn.id).maybeSingle();
    if (!existingOrder) {
      await supabaseAdmin.from("orders").insert({
        user_id: txn.user_id,
        product_id: meta.product_id as string,
        package_id: meta.package_id as string,
        game_id: (meta.game_id as string) || "",
        payment_method: "instant",
        amount: txn.amount,
        status: "pending",
        transaction_id: txn.id,
      });
    }
  }

  await supabaseAdmin
    .from("transactions")
    .update({
      status: "completed",
      uddoktapay_invoice_id: invoiceId ?? txn.uddoktapay_invoice_id,
      metadata: nextMeta,
    })
    .eq("id", txn.id);

  return txnType;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const params = asObject(body.params);
    const transactionId = firstString(body.transactionId, body.transaction_id, params.transaction_id);
    const cancelled = body.cancelled === true || normalizedStatus(params.status) === "cancel";

    if (!transactionId) throw new Error("Transaction id is required");

    const { data: txn, error: txnError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (txnError || !txn) throw txnError ?? new Error("Transaction not found");

    const txnType = firstString(txn.type, asObject(txn.metadata).type) || "payment";
    if (txn.status === "completed") {
      return new Response(JSON.stringify({ status: "already_completed", type: txnType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (cancelled) {
      await supabaseAdmin.from("transactions").update({ status: "failed" }).eq("id", txn.id);
      return new Response(JSON.stringify({ status: "cancelled", type: txnType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const initResponse = asObject(asObject(txn.metadata).init_response);
    const initNested = asObject(initResponse.data);
    const invoiceId = firstString(
      params.invoice_id,
      params.invoiceId,
      params.payment_id,
      params.paymentId,
      params.invoice,
      txn.uddoktapay_invoice_id,
      initResponse.invoice_id,
      initNested.invoice_id,
      initResponse.invoiceId,
      initNested.invoiceId,
    );

    if (!invoiceId) {
      return new Response(JSON.stringify({ status: "pending", type: txnType, message: "Invoice id not available yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifyData = await verifyPayment(invoiceId);
    const verifyObj = asObject(verifyData);
    const verifyNested = asObject(verifyObj.data);
    const providerStatus = firstString(verifyObj.status, verifyObj.payment_status, verifyNested.status, verifyNested.payment_status);

    if (isFailed(providerStatus)) {
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          uddoktapay_invoice_id: invoiceId,
          metadata: { ...asObject(txn.metadata), verify_data: verifyData },
        })
        .eq("id", txn.id);
      return new Response(JSON.stringify({ status: "failed", type: txnType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isCompleted(providerStatus)) {
      return new Response(JSON.stringify({ status: "pending", type: txnType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalizedType = await finalizeTransaction(supabaseAdmin, txn, invoiceId, verifyData);
    return new Response(JSON.stringify({ status: "completed", type: finalizedType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Finalize error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
