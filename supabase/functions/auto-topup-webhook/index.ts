import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const respond = (ok: boolean, payload: Record<string, unknown>, status = 200) =>
  jsonResponse({ ok, ...payload }, status);

const isInvalidUidError = (msg: string): boolean => {
  const lower = msg.toLowerCase();
  return (
    lower.includes("invalid uid") ||
    lower.includes("invalid region") ||
    lower.includes("not bd server") ||
    lower.includes("wrong uid")
  );
};

const parseBufferPayload = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(parseBufferPayload);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (record.type === "Buffer" && Array.isArray(record.data)) {
      return btoa(String.fromCharCode(...(record.data as number[])));
    }

    const parsed: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) {
      parsed[key] = parseBufferPayload(item);
    }
    return parsed;
  }

  return value;
};

const getMode = (url: URL, body: Record<string, unknown>) => {
  const source = url.searchParams.get("source")?.toLowerCase();

  if (source === "automation" || source === "humayun") {
    return source;
  }

  // FreeFire Server (GamesBazar) format: { orderid, status, content } with ?order= query param
  if (url.searchParams.has("order") && (body.orderid || body.status || body.content)) {
    return "freefire";
  }

  if (body.data && typeof body.data === "object") {
    return "default";
  }

  if (body.order_id && body.status) {
    return "automation";
  }

  return "unknown";
};

const getOrder = async (orderId: string) => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, amount, status")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
};

const getLinkedExternalOrder = async (orderId: string) => {
  const selectFields = "id, callback_url, external_order_id, product_name, package_name, game_id, amount";

  const { data: linkedOrder } = await supabaseAdmin
    .from("external_orders")
    .select(selectFields)
    .eq("internal_order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkedOrder) {
    return linkedOrder;
  }

  const { data: legacyOrder } = await supabaseAdmin
    .from("external_orders")
    .select(selectFields)
    .eq("external_order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return legacyOrder;
};

const updateOrder = async (orderId: string, updates: Record<string, unknown>) => {
  const { error } = await supabaseAdmin.from("orders").update(updates).eq("id", orderId);
  if (error) throw error;
  
  // Forward callback to external website if this order came from API
  await forwardExternalCallback(orderId, updates);
};

const forwardExternalCallback = async (orderId: string, updates: Record<string, unknown>) => {
  const extOrder = await getLinkedExternalOrder(orderId);

  if (!extOrder) {
    return;
  }

  try {
    const newStatus = String(updates.status || "");
    if (!newStatus) return;

    // Update external_orders status too
    await supabaseAdmin.from("external_orders").update({ status: newStatus }).eq("id", extOrder.id);

    if (!extOrder.callback_url || !extOrder.callback_url.trim()) return;

    // Send callback to source website
    const callbackRes = await fetch(extOrder.callback_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: extOrder.id,
        external_order_id: extOrder.external_order_id,
        status: newStatus,
        product_name: extOrder.product_name,
        package_name: extOrder.package_name,
        game_id: extOrder.game_id,
        amount: extOrder.amount,
        delivery_message: updates.delivery_message || null,
      }),
    });
    const callbackText = await callbackRes.text();
    await supabaseAdmin.from("external_orders").update({
      callback_status: callbackRes.ok ? "sent" : "failed",
      callback_response: callbackText.slice(0, 500),
    }).eq("id", extOrder.id);

    console.log("External callback sent:", { orderId, status: newStatus, ok: callbackRes.ok });
  } catch (e) {
    await supabaseAdmin.from("external_orders").update({
      callback_status: "failed",
      callback_response: (e as Error).message.slice(0, 500),
    }).eq("id", extOrder.id);

    console.error("External callback error:", e);
  }
};

const refundWalletIfNeeded = async (order: { id: string; user_id: string; amount: number; status: string }) => {
  if (!["pending", "processing"].includes(order.status)) {
    return false;
  }

  const { data: wallet, error: walletError } = await supabaseAdmin
    .from("wallets")
    .select("id, balance")
    .eq("user_id", order.user_id)
    .single();

  if (walletError || !wallet) {
    console.error("Refund wallet not found:", walletError?.message || order.user_id);
    return false;
  }

  const { error: refundError } = await supabaseAdmin
    .from("wallets")
    .update({ balance: Number(wallet.balance) + Number(order.amount) })
    .eq("id", wallet.id);

  if (refundError) throw refundError;

  return true;
};

const handleInvalidUid = async (
  order: { id: string; user_id: string; amount: number; status: string },
  deliveryMessage = "Invalid uid or not BD server",
) => {
  const refunded = await refundWalletIfNeeded(order);
  await updateOrder(order.id, { status: "cancelled", delivery_message: deliveryMessage });

  return respond(true, {
    message: "Order canceled and refund processed due to invalid UID/region",
    order_id: order.id,
    status: "cancelled",
    refunded,
  });
};

const handleFreefireWebhook = async (url: URL, body: Record<string, unknown>) => {
  const orderId = url.searchParams.get("order") || String(body.orderid || "");

  if (!orderId) {
    return respond(false, { error: "Missing order_id" });
  }

  const order = await getOrder(orderId);
  if (!order) {
    return respond(false, { error: "Order not found", order_id: orderId });
  }

  if (["completed", "cancelled"].includes(order.status)) {
    return respond(true, { message: "Order already processed", order_id: orderId, status: order.status });
  }

  const rawStatus = String(body.status || "").toLowerCase();
  const content = String(body.content || "");

  console.log("FreeFire webhook processing:", { orderId, rawStatus, content });

  // Check for invalid UID / player ID errors
  if (content && (isInvalidUidError(content) || content.toLowerCase().includes("invalid player"))) {
    return handleInvalidUid(order, content || "Invalid Player ID");
  }

  if (["success", "finish", "completed", "complete"].includes(rawStatus)) {
    await updateOrder(orderId, { status: "completed", delivery_message: null });
    return respond(true, { message: "Order completed", order_id: orderId, status: "completed" });
  }

  if (["error", "failed"].includes(rawStatus)) {
    // Check if content has cancel-worthy messages
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("canceled by admin") || lowerContent.includes("cancelled by admin")) {
      return handleInvalidUid(order, "Order canceled by Admin");
    }

    await updateOrder(orderId, { status: "processing", delivery_message: content || "Order failed" });
    return respond(false, {
      message: "Order failed",
      order_id: orderId,
      status: "processing",
      delivery_message: content,
    });
  }

  return respond(true, { message: "Webhook received", order_id: orderId, received_status: rawStatus });
};

const handleDefaultWebhook = async (url: URL, body: Record<string, unknown>) => {
  const parsed = parseBufferPayload(body) as Record<string, any>;
  const orderId = url.searchParams.get("order") || parsed.order_id;

  if (!orderId) {
    return respond(false, { error: "Missing order_id" });
  }

  const order = await getOrder(orderId);
  if (!order) {
    return respond(false, { error: "Order not found", order_id: orderId });
  }

  if (["completed", "cancelled"].includes(order.status)) {
    return respond(true, { message: "Order already processed", order_id: orderId, status: order.status });
  }

  const status = String(parsed?.data?.status || "").toLowerCase();
  const orderState = (parsed?.data?.orderState || {}) as Record<string, unknown>;
  const failedMessage = String(orderState.orderFailedMessage || "");
  const errorCode = orderState.orderFailedErrorCode ? ` (Error Code: ${orderState.orderFailedErrorCode})` : "";
  const reason = `${failedMessage}${errorCode}`.trim() || "Order failed";

  if (status === "update") {
    return respond(true, { message: "Update received", order_id: orderId });
  }

  if (["success", "finish", "completed", "complete"].includes(status)) {
    await updateOrder(orderId, { status: "completed", delivery_message: null });
    return respond(true, { message: "Order completed successfully", order_id: orderId, status: "completed" });
  }

  if (failedMessage && isInvalidUidError(failedMessage)) {
    return handleInvalidUid(order, "Invalid uid or not BD server");
  }

  if (["error", "failed"].includes(status)) {
    await updateOrder(orderId, { status: "processing", delivery_message: reason });
    return respond(false, {
      message: "Order failed and kept in processing",
      order_id: orderId,
      status: "processing",
      delivery_message: reason,
    });
  }

  return respond(true, { message: "Webhook received", order_id: orderId, received_status: status || null });
};

const handleStatusWebhook = async (mode: "automation" | "humayun", body: Record<string, unknown>) => {
  const orderId = String(body.order_id || "");
  const rawStatus = String(body.status || "").toLowerCase();
  const errorMessage = String(body.message || body.error_message || "");

  if (!orderId || !rawStatus) {
    return respond(false, { error: "Missing required fields: order_id, status" });
  }

  const order = await getOrder(orderId);
  if (!order) {
    return respond(false, { error: "Order not found", order_id: orderId });
  }

  if (errorMessage && isInvalidUidError(errorMessage)) {
    return handleInvalidUid(order, "Invalid uid or not BD server");
  }

  if (["completed", "complete", "success", "finish"].includes(rawStatus)) {
    await updateOrder(orderId, { status: "completed", delivery_message: null });
    return respond(true, { message: "Order status updated successfully", order_id: orderId, status: "completed" });
  }

  if (rawStatus === "processing") {
    if (!['completed', 'cancelled'].includes(order.status)) {
      await updateOrder(orderId, { status: "processing", delivery_message: errorMessage || null });
    }

    return respond(true, { message: "Order is processing", order_id: orderId, status: "processing" });
  }

  if (["hold", "failed", "error"].includes(rawStatus)) {
    if (mode === "automation" && order.status === "pending") {
      await updateOrder(orderId, { status: "processing", delivery_message: errorMessage || order.status });
      return respond(true, {
        message: "Failure status received and order kept in processing",
        order_id: orderId,
        status: "processing",
        delivery_message: errorMessage || null,
      });
    }

    return respond(true, {
      message: "Status received but no cancellation was needed",
      order_id: orderId,
      status: order.status,
      delivery_message: errorMessage || null,
    });
  }

  return respond(false, {
    error: "Unknown status",
    order_id: orderId,
    received_status: rawStatus,
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const url = new URL(req.url);
    const mode = getMode(url, body);

    console.log("Webhook received:", { mode, path: url.pathname, search: url.search, body });

    if (mode === "default") {
      return await handleDefaultWebhook(url, body);
    }

    if (mode === "freefire") {
      return await handleFreefireWebhook(url, body);
    }

    if (mode === "automation" || mode === "humayun") {
      return await handleStatusWebhook(mode, body);
    }

    return respond(false, {
      error: "Unknown webhook payload",
      hint: "Send legacy data.status payload or order_id + status",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", message);
    return respond(false, { error: message });
  }
});
