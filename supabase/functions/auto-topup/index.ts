import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { order_id } = body;
    if (!order_id) throw new Error("Missing order_id");

    // Get order with package and auto_api info
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*, packages(*, auto_apis(*))")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) throw new Error("Order not found");

    const pkg = order.packages;
    if (!pkg?.auto_topup_enabled || !pkg?.auto_apis) {
      return new Response(JSON.stringify({ success: false, message: "Auto topup not enabled for this package" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const autoApi = pkg.auto_apis;
    if (!autoApi.is_active) throw new Error("Auto API is disabled");

    // Parse game_id field - it may contain JSON with multiple fields
    let fields: Record<string, string> = {};
    try {
      fields = JSON.parse(order.game_id);
    } catch {
      fields = { game_id: order.game_id };
    }

    // Build request to external API
    const apiUrl = autoApi.base_url.startsWith("http") ? autoApi.base_url : `https://${autoApi.base_url}`;
    
    const payload = {
      api_key: autoApi.api_key,
      product_variation_name: pkg.product_variation_name || pkg.name,
      ...fields,
    };

    console.log("Auto topup request:", { url: apiUrl, payload: { ...payload, api_key: "***" } });

    // Forward to external API
    const extResponse = await fetch(`${apiUrl}/api/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const extData = await extResponse.json();
    console.log("Auto topup response:", extData);

    if (extResponse.ok && (extData.success || extData.status === "success")) {
      // Update order status to completed
      await supabaseAdmin.from("orders").update({ 
        status: "processing",
        transaction_id: extData.transaction_id || extData.trx_id || null,
      }).eq("id", order_id);

      return new Response(JSON.stringify({ success: true, data: extData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Mark order but don't fail - admin can handle
      await supabaseAdmin.from("orders").update({ status: "pending" }).eq("id", order_id);
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: extData.message || "External API error",
        data: extData,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
