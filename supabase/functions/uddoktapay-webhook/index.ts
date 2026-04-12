import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UDDOKTAPAY_API_KEY = Deno.env.get("UDDOKTAPAY_API_KEY")!;
const UDDOKTAPAY_BASE = "https://sandbox.uddoktapay.com/api";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const invoiceId = body.invoice_id;

    if (!invoiceId) throw new Error("No invoice_id");

    // Verify with UddoktaPay
    const verifyRes = await fetch(`${UDDOKTAPAY_BASE}/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
    const verifyData = await verifyRes.json();

    if (verifyData.status !== "COMPLETED") {
      // Update transaction as failed
      await supabaseAdmin.from("transactions")
        .update({ status: "failed" })
        .eq("uddoktapay_invoice_id", invoiceId);
      return new Response(JSON.stringify({ status: "failed" }), { status: 200 });
    }

    // Get transaction
    const { data: txn } = await supabaseAdmin.from("transactions")
      .select("*")
      .eq("uddoktapay_invoice_id", invoiceId)
      .single();

    if (!txn) throw new Error("Transaction not found");
    if (txn.status === "completed") {
      return new Response(JSON.stringify({ status: "already_completed" }), { status: 200 });
    }

    // Update transaction
    await supabaseAdmin.from("transactions")
      .update({ status: "completed", metadata: { ...((txn.metadata as Record<string, unknown>) || {}), verify_data: verifyData } })
      .eq("id", txn.id);

    const meta = txn.metadata as Record<string, unknown>;
    const txnType = meta?.type as string || "payment";

    if (txnType === "add_money") {
      // Add money to wallet
      const { data: wallet } = await supabaseAdmin.from("wallets").select("*").eq("user_id", txn.user_id).single();
      if (wallet) {
        await supabaseAdmin.from("wallets").update({ balance: wallet.balance + txn.amount }).eq("id", wallet.id);
      } else {
        await supabaseAdmin.from("wallets").insert({ user_id: txn.user_id, balance: txn.amount });
      }
    } else if (txnType === "payment") {
      // Create order
      await supabaseAdmin.from("orders").insert({
        user_id: txn.user_id,
        product_id: meta?.product_id as string,
        package_id: meta?.package_id as string,
        game_id: meta?.game_id as string || "",
        payment_method: "instant",
        amount: txn.amount,
        status: "pending",
        transaction_id: txn.id,
      });
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
});
