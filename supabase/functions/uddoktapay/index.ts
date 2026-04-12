import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const UDDOKTAPAY_API_KEY = Deno.env.get("UDDOKTAPAY_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UDDOKTAPAY_BASE = "https://sandbox.uddoktapay.com/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // === INIT PAYMENT ===
    if (path === "uddoktapay" && req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Unauthorized");
      
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) throw new Error("Unauthorized");

      const body = await req.json();
      const { amount, product_id, package_id, game_id, type } = body;

      if (!amount || amount <= 0) throw new Error("Invalid amount");

      const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
      const redirectBase = url.origin;

      // Create transaction record
      const { data: txn, error: txnError } = await supabaseAdmin
        .from("transactions")
        .insert({
          user_id: user.id,
          amount,
          type: type || "payment",
          payment_method: "uddoktapay",
          status: "pending",
          metadata: { product_id, package_id, game_id }
        })
        .select()
        .single();
      if (txnError) throw txnError;

      // Call UddoktaPay
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
          metadata: { transaction_id: txn.id, user_id: user.id, product_id, package_id, game_id, type: type || "payment" },
          redirect_url: `${body.redirect_url || "https://id-preview--21d6cfc0-284a-4ee3-b9f2-961ac9f6e5d5.lovable.app"}/payment-callback`,
          cancel_url: `${body.redirect_url || "https://id-preview--21d6cfc0-284a-4ee3-b9f2-961ac9f6e5d5.lovable.app"}/payment-callback?status=cancel`,
          webhook_url: `${SUPABASE_URL}/functions/v1/uddoktapay-webhook`,
        }),
      });

      const uddoktaData = await uddoktaRes.json();
      if (!uddoktaRes.ok) throw new Error(`UddoktaPay error: ${JSON.stringify(uddoktaData)}`);

      // Update transaction with invoice id
      if (uddoktaData.invoice_id) {
        await supabaseAdmin.from("transactions").update({ uddoktapay_invoice_id: uddoktaData.invoice_id }).eq("id", txn.id);
      }

      return new Response(JSON.stringify({ payment_url: uddoktaData.payment_url, transaction_id: txn.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Not found");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("UddoktaPay error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
