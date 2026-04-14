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
      fields = { uid: order.game_id };
    }

    // Build API URL - ensure proper format
    const baseUrl = autoApi.base_url.startsWith("http") ? autoApi.base_url : `https://${autoApi.base_url}`;
    const apiUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    
    const apiType = autoApi.api_type || "automation";
    const variationName = pkg.product_variation_name || pkg.name;
    const uid = fields.uid || fields.game_id || order.game_id;

    let endpoint: string;
    let payload: Record<string, string>;

    let fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };

    if (apiType === "freefire") {
      // FreeFire Server format - Bearer token auth, direct URL
      endpoint = apiUrl;
      const callbackUrl = `${SUPABASE_URL}/functions/v1/api?order=${order.id}`;
      
      // Parse quantity from variation name (e.g. "weekly2" → name="weekly", quantity=2)
      let parsedName = variationName;
      let quantity = 1;
      const match = variationName.match(/^(weekly|monthly)(\d+)$/i);
      if (match) {
        parsedName = match[1];
        quantity = parseInt(match[2], 10);
      }

      fetchHeaders["Authorization"] = `Bearer ${autoApi.api_key}`;
      payload = {
        quantity: String(quantity),
        selectedPackage: JSON.stringify({ id: 1, tag_line: parsedName }),
        account_info: JSON.stringify(fields),
        url: callbackUrl,
        order_id: order.id,
        user_id: "nouser",
      };
    } else if (apiType === "humayun") {
      // Humayun API format
      endpoint = `${apiUrl}/webhook/humayun/order`;
      const callbackUrl = `${SUPABASE_URL}/functions/v1/api?source=humayun`;
      payload = {
        api_key: autoApi.api_key,
        order_id: order.id,
        uid,
        variation_name: variationName,
        status: "Processing",
        callback_url: callbackUrl,
      };
    } else {
      // Default automation API format
      endpoint = `${apiUrl}/webhook/website/order`;
      const callbackUrl = `${SUPABASE_URL}/functions/v1/api?source=automation`;
      payload = {
        api_key: autoApi.api_key,
        order_id: order.id,
        product_variation_name: variationName,
        diamond_quantity: variationName,
        uid,
        status: "Processing",
        order_time: new Date().toISOString(),
        callback_url: callbackUrl,
      };
    }

    console.log("Auto topup request:", { type: apiType, url: endpoint, payload: { ...payload, api_key: "***" } });

    const bodyPayload = apiType === "freefire" 
      ? { ...Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, typeof v === "string" && (v.startsWith("{") || v.startsWith("[")) ? JSON.parse(v) : v])) }
      : payload;

    const extResponse = await fetch(endpoint, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(bodyPayload),
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
