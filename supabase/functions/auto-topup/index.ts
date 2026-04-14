import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // game_id is the UID (account_info) - always treat as string
    const uid = String(order.game_id).trim();

    // Build API URL
    const baseUrl = autoApi.base_url.startsWith("http") ? autoApi.base_url : `https://${autoApi.base_url}`;
    const apiUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    
    const apiType = autoApi.api_type || "freefire";
    const variationName = pkg.product_variation_name || pkg.name;

    let endpoint: string;
    let bodyPayload: Record<string, unknown> = {};
    const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };

    if (apiType === "humayun") {
      // Humayun format: POST to /webhook/humayun/order with api_key in body
      endpoint = `${apiUrl}/webhook/humayun/order`;
      const callbackUrl = `${SUPABASE_URL}/functions/v1/api?source=humayun`;
      bodyPayload = {
        api_key: autoApi.api_key,
        order_id: order.id,
        uid,
        variation_name: variationName,
        status: "Processing",
        callback_url: callbackUrl,
      };
    } else {
      // FreeFire Server format: Bearer token auth, account_info is the uid string directly
      endpoint = apiUrl;
      const callbackUrl = `${SUPABASE_URL}/functions/v1/api?order=${order.id}`;
      
      let parsedName = variationName;
      let quantity = 1;
      const match = variationName.match(/^(weekly|monthly)(\d+)$/i);
      if (match) {
        parsedName = match[1];
        quantity = parseInt(match[2], 10);
      }

      fetchHeaders["Authorization"] = `Bearer ${autoApi.api_key}`;
      bodyPayload = {
        quantity,
        selectedPackage: { id: 1, tag_line: parsedName },
        account_info: uid,
        url: callbackUrl,
        order_id: order.id,
        user_id: "nouser",
      };
    }

    console.log("Auto topup request:", { type: apiType, url: endpoint, payload: { ...bodyPayload, api_key: "***" } });

    const extResponse = await fetch(endpoint, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(bodyPayload),
    });

    const responseText = await extResponse.text();
    console.log("Auto topup raw response:", responseText.substring(0, 500));

    let extData: Record<string, unknown>;
    try {
      extData = JSON.parse(responseText);
    } catch {
      console.error("Auto topup: External API returned non-JSON response");
      await supabaseAdmin.from("orders").update({ status: "pending", delivery_message: "External API returned invalid response" }).eq("id", order_id);
      return new Response(JSON.stringify({ 
        success: false, 
        message: "External API returned non-JSON response",
        raw: responseText.substring(0, 200),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Auto topup response:", extData);

    if (extResponse.ok && (extData.success || extData.status === "success")) {
      await supabaseAdmin.from("orders").update({ 
        status: "processing",
        transaction_id: extData.transaction_id || extData.trx_id || null,
      }).eq("id", order_id);

      return new Response(JSON.stringify({ success: true, data: extData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
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
