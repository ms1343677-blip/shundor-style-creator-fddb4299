import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    const action = path[path.length - 1] || "create";

    const apiKey = req.headers.get("x-api-key") || url.searchParams.get("api_key");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "API key required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate API key
    const { data: app, error: appError } = await supabase
      .from("developer_apps")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (appError || !app) {
      return new Response(JSON.stringify({ success: false, error: "Invalid or inactive API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== CREATE ORDER ==========
    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      const { product_name, package_name, game_id, amount, external_order_id, callback_url } = body;

      if (!product_name || !game_id || !amount) {
        return new Response(JSON.stringify({ success: false, error: "product_name, game_id, amount are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const orderAmount = Number(amount);
      if (isNaN(orderAmount) || orderAmount <= 0) {
        return new Response(JSON.stringify({ success: false, error: "Invalid amount" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate package_name or product_name against existing packages
      const matchField = package_name || product_name;
      const { data: matchedPkg } = await supabase
        .from("packages")
        .select("id, name, product_variation_name, price, product_id, auto_topup_enabled, auto_api_id")
        .eq("is_active", true)
        .ilike("product_variation_name", matchField)
        .limit(1)
        .maybeSingle();

      let validPkg = matchedPkg;
      if (!validPkg) {
        const { data: matchedByName } = await supabase
          .from("packages")
          .select("id, name, product_variation_name, price, product_id, auto_topup_enabled, auto_api_id")
          .eq("is_active", true)
          .ilike("name", matchField)
          .limit(1)
          .maybeSingle();

        if (!matchedByName) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `No matching package found for "${matchField}". Please use a valid product_variation_name or package name.` 
          }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        validPkg = matchedByName;
      }

      // Extract source website from callback_url or referer
      const sourceUrl = callback_url || req.headers.get("referer") || req.headers.get("origin") || "";

      // 1) Create real order in orders table (same as normal user) with source_url
      const { data: realOrder, error: realOrderError } = await supabase
        .from("orders")
        .insert({
          user_id: app.user_id,
          product_id: validPkg.product_id,
          package_id: validPkg.id,
          game_id,
          payment_method: "api",
          amount: validPkg.price,
          status: "pending",
          source_url: sourceUrl || null,
        })
        .select()
        .single();

      if (realOrderError) {
        console.error("Real order create error:", realOrderError);
        return new Response(JSON.stringify({ success: false, error: "Failed to create order" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2) Track in external_orders for API logging + callback forwarding
      const { data: extOrder } = await supabase
        .from("external_orders")
        .insert({
          developer_app_id: app.id,
          external_order_id: external_order_id || String(realOrder.id),
          product_name: product_name || validPkg.product_variation_name,
          package_name: validPkg.product_variation_name,
          game_id,
          amount: validPkg.price,
          status: "pending",
          callback_url: callback_url || "",
        })
        .select()
        .single();

      // 3) Trigger auto-topup if package has it enabled
      if (validPkg.auto_topup_enabled && validPkg.auto_api_id) {
        try {
          const autoTopupUrl = `${SUPABASE_URL}/functions/v1/auto-topup`;
          const topupRes = await fetch(autoTopupUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ order_id: realOrder.id }),
          });
          const topupData = await topupRes.text();
          console.log("Auto-topup response:", topupData.substring(0, 300));
        } catch (e) {
          console.error("Auto-topup trigger error:", e);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        order_id: realOrder.id,
        external_order_id: extOrder?.id,
        status: realOrder.status,
        message: "Order created successfully",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== CHECK STATUS ==========
    if (req.method === "GET" && action === "status") {
      const orderId = url.searchParams.get("order_id");
      if (!orderId) {
        return new Response(JSON.stringify({ success: false, error: "order_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: order, error: orderError } = await supabase
        .from("external_orders")
        .select("id, external_order_id, product_name, package_name, game_id, amount, status, callback_status, created_at")
        .eq("id", orderId)
        .eq("developer_app_id", app.id)
        .single();

      if (orderError || !order) {
        return new Response(JSON.stringify({ success: false, error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, order }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== BALANCE CHECK ==========
    if (req.method === "GET" && action === "balance") {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", app.user_id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        balance: wallet?.balance || 0,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== CALLBACK (admin triggers) ==========
    if (req.method === "POST" && action === "callback") {
      const body = await req.json();
      const { order_id, status: newStatus } = body;

      if (!order_id || !newStatus) {
        return new Response(JSON.stringify({ success: false, error: "order_id and status required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: order, error: updateError } = await supabase
        .from("external_orders")
        .update({ status: newStatus })
        .eq("id", order_id)
        .select("*, developer_apps(*)")
        .single();

      if (updateError || !order) {
        return new Response(JSON.stringify({ success: false, error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Send callback to the website that sent this order
      const callbackUrl = (order as any).callback_url;
      if (callbackUrl && callbackUrl.trim()) {
        try {
          const callbackRes = await fetch(callbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: order.id,
              external_order_id: order.external_order_id,
              status: newStatus,
              product_name: order.product_name,
              package_name: order.package_name,
              game_id: order.game_id,
              amount: order.amount,
            }),
          });
          const callbackText = await callbackRes.text();
          await supabase.from("external_orders").update({
            callback_status: callbackRes.ok ? "sent" : "failed",
            callback_response: callbackText.slice(0, 500),
          }).eq("id", order.id);
        } catch (e) {
          await supabase.from("external_orders").update({
            callback_status: "failed",
            callback_response: (e as Error).message,
          }).eq("id", order.id);
        }
      }

      return new Response(JSON.stringify({ success: true, message: "Order updated" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid endpoint" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("External order error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
