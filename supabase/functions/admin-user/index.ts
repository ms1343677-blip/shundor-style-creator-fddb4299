import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getLinkedExternalOrder = async (adminClient: ReturnType<typeof createClient>, orderId: string) => {
  const selectFields = "id, callback_url, external_order_id, product_name, package_name, game_id, amount";

  const { data: linkedOrder } = await adminClient
    .from("external_orders")
    .select(selectFields)
    .eq("internal_order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkedOrder) return linkedOrder;

  const { data: legacyOrder } = await adminClient
    .from("external_orders")
    .select(selectFields)
    .eq("external_order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return legacyOrder;
};

const forwardExternalOrderCallback = async (
  adminClient: ReturnType<typeof createClient>,
  orderId: string,
  status: string,
  deliveryMessage: string | null,
) => {
  const linkedOrder = await getLinkedExternalOrder(adminClient, orderId);
  if (!linkedOrder) return;

  await adminClient.from("external_orders").update({ status }).eq("id", linkedOrder.id);

  if (!linkedOrder.callback_url || !linkedOrder.callback_url.trim()) return;

  try {
    const callbackRes = await fetch(linkedOrder.callback_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: linkedOrder.id,
        external_order_id: linkedOrder.external_order_id,
        status,
        product_name: linkedOrder.product_name,
        package_name: linkedOrder.package_name,
        game_id: linkedOrder.game_id,
        amount: linkedOrder.amount,
        delivery_message: deliveryMessage,
      }),
    });

    const callbackText = await callbackRes.text();
    await adminClient.from("external_orders").update({
      callback_status: callbackRes.ok ? "sent" : "failed",
      callback_response: callbackText.slice(0, 500),
    }).eq("id", linkedOrder.id);
  } catch (error: any) {
    await adminClient.from("external_orders").update({
      callback_status: "failed",
      callback_response: String(error?.message || "Callback send failed").slice(0, 500),
    }).eq("id", linkedOrder.id);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const { action, user_id, amount, role, full_name, order_id, status, delivery_message } = body;

    if (action === "add_balance") {
      if (!user_id || !amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400, headers: corsHeaders });
      }
      // Get current balance
      const { data: wallet, error: wErr } = await adminClient
        .from("wallets")
        .select("balance")
        .eq("user_id", user_id)
        .single();
      if (wErr) throw wErr;

      const newBalance = (wallet?.balance || 0) + amount;
      const { error: uErr } = await adminClient
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", user_id);
      if (uErr) throw uErr;

      return new Response(JSON.stringify({ success: true, balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_role") {
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400, headers: corsHeaders });
      }
      if (role === "remove") {
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
      } else {
        // Upsert role
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        const { error: rErr } = await adminClient.from("user_roles").insert({ user_id, role });
        if (rErr) throw rErr;
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_order_status") {
      if (!order_id || !status) {
        return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400, headers: corsHeaders });
      }

      const { data: order, error: orderError } = await adminClient
        .from("orders")
        .select("id, status, delivery_message")
        .eq("id", order_id)
        .single();

      if (orderError || !order) {
        return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: corsHeaders });
      }

      const nextDeliveryMessage = delivery_message !== undefined ? delivery_message : order.delivery_message;

      const updates: Record<string, unknown> = { status };
      if (delivery_message !== undefined) {
        updates.delivery_message = delivery_message;
      }

      const { error: updateError } = await adminClient
        .from("orders")
        .update(updates)
        .eq("id", order_id);

      if (updateError) throw updateError;

      await forwardExternalOrderCallback(
        adminClient,
        order_id,
        status,
        typeof nextDeliveryMessage === "string" ? nextDeliveryMessage : null,
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_profile") {
      if (!user_id) {
        return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400, headers: corsHeaders });
      }
      const updates: any = {};
      if (full_name !== undefined) updates.full_name = full_name;
      
      const { error: pErr } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("user_id", user_id);
      if (pErr) throw pErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
