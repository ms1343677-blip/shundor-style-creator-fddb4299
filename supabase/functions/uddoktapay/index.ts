import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const UDDOKTAPAY_API_KEY = Deno.env.get("UDDOKTAPAY_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UDDOKTAPAY_BASE = "https://sandbox.uddoktapay.com/api";

const asObject = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const firstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

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
    const { amount, product_id, package_id, game_id, type } = body;
    if (!amount || Number(amount) <= 0) throw new Error("Invalid amount");

    const paymentType = typeof type === "string" && type.trim() ? type.trim() : "payment";
    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    const redirectOrigin = typeof body.redirect_url === "string" && body.redirect_url ? body.redirect_url : "https://id-preview--21d6cfc0-284a-4ee3-b9f2-961ac9f6e5d5.lovable.app";

    const transactionMeta = {
      product_id: product_id ?? null,
      package_id: package_id ?? null,
      game_id: game_id ?? null,
      type: paymentType,
    };

    const { data: txn, error: txnError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: Number(amount),
        type: paymentType,
        payment_method: "uddoktapay",
        status: "pending",
        metadata: transactionMeta,
      })
      .select()
      .single();
    if (txnError || !txn) throw txnError ?? new Error("Failed to create transaction");

    const redirectUrl = new URL(`${redirectOrigin}/payment-callback`);
    redirectUrl.searchParams.set("transaction_id", txn.id);
    redirectUrl.searchParams.set("flow", paymentType);

    const cancelUrl = new URL(`${redirectOrigin}/payment-callback`);
    cancelUrl.searchParams.set("transaction_id", txn.id);
    cancelUrl.searchParams.set("flow", paymentType);
    cancelUrl.searchParams.set("status", "cancel");

    const uddoktaRes = await fetch(`${UDDOKTAPAY_BASE}/checkout-v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
      },
      body: JSON.stringify({
        full_name: fullName,
        email: user.email,
        amount: String(amount),
        metadata: {
          transaction_id: txn.id,
          user_id: user.id,
          product_id: product_id ?? null,
          package_id: package_id ?? null,
          game_id: game_id ?? null,
          type: paymentType,
        },
        redirect_url: redirectUrl.toString(),
        cancel_url: cancelUrl.toString(),
        webhook_url: `${SUPABASE_URL}/functions/v1/uddoktapay-webhook`,
      }),
    });

    const uddoktaData = await uddoktaRes.json();
    const providerData = asObject(uddoktaData);
    const providerNested = asObject(providerData.data);
    const paymentUrl = firstString(
      providerData.payment_url,
      providerNested.payment_url,
      providerData.checkout_url,
      providerNested.checkout_url,
      providerData.url,
      providerNested.url,
    );
    const invoiceId = firstString(
      providerData.invoice_id,
      providerNested.invoice_id,
      providerData.invoiceId,
      providerNested.invoiceId,
    );

    if (!uddoktaRes.ok || !paymentUrl) {
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          metadata: {
            ...transactionMeta,
            init_response: uddoktaData,
            init_error: !uddoktaRes.ok ? "gateway_error" : "payment_url_missing",
          },
        })
        .eq("id", txn.id);
      throw new Error(`UddoktaPay error: ${JSON.stringify(uddoktaData)}`);
    }

    await supabaseAdmin
      .from("transactions")
      .update({
        uddoktapay_invoice_id: invoiceId,
        metadata: {
          ...transactionMeta,
          init_response: uddoktaData,
        },
      })
      .eq("id", txn.id);

    return new Response(
      JSON.stringify({
        payment_url: paymentUrl,
        transaction_id: txn.id,
        invoice_id: invoiceId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("UddoktaPay error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
