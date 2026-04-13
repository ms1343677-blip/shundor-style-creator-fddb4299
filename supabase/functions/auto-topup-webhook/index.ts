import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Check if error message indicates invalid UID/region
const isInvalidUidError = (msg: string): boolean => {
  const lower = msg.toLowerCase();
  return (
    lower.includes("invalid uid") ||
    lower.includes("invalid region") ||
    lower.includes("not bd server") ||
    lower.includes("wrong uid")
  );
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  // Determine webhook type from path: /auto-topup-webhook/humayun, /auto-topup-webhook/automation, or default
  const pathParts = url.pathname.split("/").filter(Boolean);
  const webhookType = pathParts[pathParts.length - 1] || "default";

  try {
    const data = await req.json();
    console.log(`Webhook [${webhookType}] received:`, JSON.stringify(data));

    // --- Route 1: Default auto-topup webhook (matches Laravel update()) ---
    if (webhookType === "auto-topup-webhook") {
      const orderId = url.searchParams.get("order") || data.order_id;
      if (!orderId) return jsonResponse({ error: "Missing order_id" }, 400);

      // Parse Buffer-like arrays recursively
      const parseBuffer = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(parseBuffer);
        if (obj && typeof obj === "object") {
          if (obj.type === "Buffer" && Array.isArray(obj.data)) {
            return btoa(String.fromCharCode(...obj.data));
          }
          const result: any = {};
          for (const [k, v] of Object.entries(obj)) {
            result[k] = parseBuffer(v);
          }
          return result;
        }
        return obj;
      };

      const parsed = parseBuffer(data);
      const status = parsed?.data?.status;
      const orderState = parsed?.data?.orderState || {};
      const errorCode = orderState.orderFailedErrorCode || 0;
      const failedMessage = orderState.orderFailedMessage || "";
      const reason = `${failedMessage} (Error Code: ${errorCode})`;

      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (orderErr || !order) return jsonResponse({ error: "Order not found" }, 404);

      if (["completed", "cancelled", "complete", "cancel"].includes(order.status)) {
        return jsonResponse({ message: "Order already processed" });
      }

      let newStatus = order.status;
      let deliveryMessage: string | null = null;

      switch (status) {
        case "success":
        case "finish":
          newStatus = "completed";
          break;
        case "error":
        case "failed":
          newStatus = "processing";
          deliveryMessage = reason || "Order failed";
          break;
        case "update":
          return jsonResponse({ message: "Update received" });
        default:
          break;
      }

      await supabaseAdmin.from("orders").update({ status: newStatus, delivery_message: deliveryMessage }).eq("id", orderId);

      // Check for invalid UID → cancel + refund
      if (isInvalidUidError(failedMessage)) {
        await supabaseAdmin.from("orders").update({ status: "cancelled", delivery_message: "Invalid uid or not BD server" }).eq("id", orderId);
        // Refund wallet
        const { data: wallet } = await supabaseAdmin.from("wallets").select("*").eq("user_id", order.user_id).single();
        if (wallet) {
          await supabaseAdmin.from("wallets").update({ balance: wallet.balance + order.amount }).eq("id", wallet.id);
        }
        console.log(`Order ${orderId} cancelled + refunded due to invalid UID`);
      }

      return jsonResponse({ message: "Webhook processed successfully" });
    }

    // --- Route 2: Humayun webhook ---
    if (webhookType === "humayun") {
      const { order_id, status, message: errMsg, error_message } = data;
      if (!order_id || !status) return jsonResponse({ error: "Missing required fields: order_id, status" }, 400);

      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .single();
      if (orderErr || !order) return jsonResponse({ error: "Order not found" }, 404);

      const errorMessage = errMsg || error_message || "";

      // Invalid UID check
      if (errorMessage && isInvalidUidError(errorMessage) && status.toLowerCase() === "failed") {
        console.log(`Humayun: Invalid UID for order ${order_id}, cancelling + refunding`);
        if (["pending", "processing"].includes(order.status)) {
          const { data: wallet } = await supabaseAdmin.from("wallets").select("*").eq("user_id", order.user_id).single();
          if (wallet && order.amount > 0) {
            await supabaseAdmin.from("wallets").update({ balance: wallet.balance + order.amount }).eq("id", wallet.id);
          }
        }
        await supabaseAdmin.from("orders").update({ status: "cancelled", delivery_message: "Invalid uid or not BD server" }).eq("id", order_id);
        return jsonResponse({ message: "Order canceled and refunded due to invalid UID/region", order_id, status: "cancelled", refunded: true });
      }

      // Only process completed
      if (["completed", "complete"].includes(status.toLowerCase())) {
        await supabaseAdmin.from("orders").update({ status: "completed" }).eq("id", order_id);
        return jsonResponse({ message: "Order status updated successfully", order_id });
      }

      return jsonResponse({ message: "Status received but not processed (only Completed or Failed with invalid UID)", order_id });
    }

    // --- Route 3: Automation webhook ---
    if (webhookType === "automation") {
      const { order_id, status: rawStatus, message: errMsg, error_message } = data;
      if (!order_id || !rawStatus) return jsonResponse({ error: "Missing required fields: order_id, status" }, 400);

      const status = rawStatus.toLowerCase();
      const errorMessage = errMsg || error_message || "";

      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .single();
      if (orderErr || !order) return jsonResponse({ error: "Order not found" }, 404);

      // Invalid UID check
      if (errorMessage && isInvalidUidError(errorMessage)) {
        console.log(`Automation: Invalid UID for order ${order_id}, cancelling + refunding`);
        if (["pending", "processing"].includes(order.status)) {
          const { data: wallet } = await supabaseAdmin.from("wallets").select("*").eq("user_id", order.user_id).single();
          if (wallet && order.amount > 0) {
            await supabaseAdmin.from("wallets").update({ balance: wallet.balance + order.amount }).eq("id", wallet.id);
          }
        }
        await supabaseAdmin.from("orders").update({ status: "cancelled", delivery_message: "Invalid uid or not BD server" }).eq("id", order_id);
        return jsonResponse({ message: "Order canceled and refunded due to invalid UID/region", order_id, status: "cancelled", refunded: true });
      }

      // Normal status handling
      switch (status) {
        case "completed":
        case "complete":
          await supabaseAdmin.from("orders").update({ status: "completed" }).eq("id", order_id);
          break;
        case "processing":
          if (order.status !== "processing") {
            await supabaseAdmin.from("orders").update({ status: "processing" }).eq("id", order_id);
          }
          break;
        case "hold":
        case "failed":
          // Don't change processing orders
          break;
        default:
          return jsonResponse({ error: "Unknown status" }, 400);
      }

      return jsonResponse({ message: "Order status updated successfully", order_id, status: order.status });
    }

    return jsonResponse({ error: "Unknown webhook type" }, 400);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Webhook error [${webhookType}]:`, message);
    return jsonResponse({ error: message }, 500);
  }
});
