import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { corsHeaders } from "@supabase/supabase-js/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { transaction_id, amount, product_id, package_id, game_id, type } = body;

    if (!transaction_id || !amount) {
      return new Response(JSON.stringify({ error: "Transaction ID and amount required" }), { status: 400, headers });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find matching SMS message
    const { data: smsMatch, error: smsError } = await supabaseAdmin
      .from("sms_messages")
      .select("*")
      .eq("transaction_id", transaction_id)
      .eq("is_used", false)
      .maybeSingle();

    if (smsError) throw smsError;

    if (!smsMatch) {
      return new Response(JSON.stringify({ error: "Transaction ID not found. Please check and try again." }), { status: 400, headers });
    }

    // Check amount match (allow small tolerance)
    const smsAmount = Number(smsMatch.amount);
    const reqAmount = Number(amount);
    if (Math.abs(smsAmount - reqAmount) > 0.5) {
      return new Response(JSON.stringify({ error: `Amount mismatch. Expected ৳${smsAmount}, got ৳${reqAmount}` }), { status: 400, headers });
    }

    // Mark SMS as used
    if (type === "add_money") {
      // Add money to wallet
      const { data: wallet } = await supabaseAdmin.from("wallets").select("*").eq("user_id", userId).maybeSingle();
      if (wallet) {
        await supabaseAdmin.from("wallets").update({ balance: Number(wallet.balance) + reqAmount }).eq("id", wallet.id);
      } else {
        await supabaseAdmin.from("wallets").insert({ user_id: userId, balance: reqAmount });
      }

      // Create transaction record
      const { data: txn } = await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        amount: reqAmount,
        type: "add_money",
        status: "completed",
        payment_method: "manual",
        metadata: { transaction_id, sms_id: smsMatch.id, sender: smsMatch.sender },
      }).select("id").single();

      // Mark SMS used
      await supabaseAdmin.from("sms_messages").update({ is_used: true, used_for_order_id: null }).eq("id", smsMatch.id);

      return new Response(JSON.stringify({ status: "completed", message: "Wallet topped up successfully!" }), { status: 200, headers });
    } else {
      // Create order
      if (!product_id || !package_id || !game_id) {
        return new Response(JSON.stringify({ error: "Product, package and game ID required" }), { status: 400, headers });
      }

      // Create transaction
      const { data: txn } = await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        amount: reqAmount,
        type: "payment",
        status: "completed",
        payment_method: "manual",
        metadata: { transaction_id, sms_id: smsMatch.id, sender: smsMatch.sender, product_id, package_id, game_id },
      }).select("id").single();

      // Create order
      const { data: order, error: orderError } = await supabaseAdmin.from("orders").insert({
        user_id: userId,
        product_id,
        package_id,
        game_id,
        payment_method: "manual",
        amount: reqAmount,
        status: "pending",
        transaction_id: txn?.id,
      }).select("id").single();

      if (orderError) throw orderError;

      // Mark SMS used
      await supabaseAdmin.from("sms_messages").update({ is_used: true, used_for_order_id: order?.id }).eq("id", smsMatch.id);

      return new Response(JSON.stringify({ status: "completed", message: "Order placed successfully!" }), { status: 200, headers });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Verify payment error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers });
  }
});
