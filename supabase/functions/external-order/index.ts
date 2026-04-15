import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    // path: /external-order/create or /external-order/status

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

    const action = path[path.length - 1] || "create";

    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      const { product_name, package_name, game_id, amount, external_order_id } = body;

      if (!product_name || !game_id || !amount) {
        return new Response(JSON.stringify({ success: false, error: "product_name, game_id, amount are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: order, error: orderError } = await supabase
        .from("external_orders")
        .insert({
          developer_app_id: app.id,
          external_order_id: external_order_id || "",
          product_name,
          package_name: package_name || "",
          game_id,
          amount,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Order create error:", orderError);
        return new Response(JSON.stringify({ success: false, error: "Failed to create order" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        order_id: order.id,
        status: order.status,
        message: "Order created successfully",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Callback endpoint - admin updates order, triggers callback
    if (req.method === "POST" && action === "callback") {
      const body = await req.json();
      const { order_id, status: newStatus } = body;

      if (!order_id || !newStatus) {
        return new Response(JSON.stringify({ success: false, error: "order_id and status required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update order status
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

      // Send callback if URL is set
      const callbackUrl = (order as any).developer_apps?.callback_url;
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
