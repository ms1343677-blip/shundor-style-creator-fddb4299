import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function detectSender(value: string) {
  const msg = value.toUpperCase();
  if (msg.includes("BKASH") || msg.includes("BKA")) return "bKash";
  if (msg.includes("NAGAD")) return "Nagad";
  if (msg.includes("ROCKET")) return "Rocket";
  return "Unknown";
}

function parseSms(message: string, senderHint?: string) {
  const result = {
    sender: senderHint ? detectSender(senderHint) : detectSender(message),
    phone_number: "",
    transaction_id: "",
    amount: 0,
    sms_balance: null as number | null,
  };

  // Extract amount
  const amountPatterns = [
    /(?:received|পেয়েছেন)\s+Tk\s*([\d,]+\.?\d*)/i,
    /Tk\s*([\d,]+\.?\d*)/i,
    /BDT\s*([\d,]+\.?\d*)/i,
    /Taka\s*([\d,]+\.?\d*)/i,
  ];
  for (const pat of amountPatterns) {
    const m = message.match(pat);
    if (m) { result.amount = parseFloat(m[1].replace(/,/g, "")); break; }
  }

  // Extract Balance from SMS - "Balance Tk 2,094.01"
  const balancePatterns = [
    /Balance\s+Tk\s*([\d,]+\.?\d*)/i,
    /Balance\s*:?\s*Tk\s*([\d,]+\.?\d*)/i,
    /ব্যালেন্স\s*:?\s*Tk\s*([\d,]+\.?\d*)/i,
  ];
  for (const pat of balancePatterns) {
    const m = message.match(pat);
    if (m) { result.sms_balance = parseFloat(m[1].replace(/,/g, "")); break; }
  }

  // Extract phone number
  const phonePatterns = [
    /(?:from|to)\s*(01\d{9})/i,
    /(01\d{9})/,
  ];
  for (const pat of phonePatterns) {
    const m = message.match(pat);
    if (m) { result.phone_number = m[1]; break; }
  }

  // Extract transaction ID
  const trxPatterns = [
    /(?:TrxID|TxnID|TransactionID|Trx\s*ID|Txn\s*ID|Transaction\s*ID)\s*[:\s]?\s*([A-Za-z0-9]+)/i,
    /(?:Ref|Reference)\s*[:\s]?\s*([A-Za-z0-9]+)/i,
  ];
  for (const pat of trxPatterns) {
    const m = message.match(pat);
    if (m) { result.transaction_id = m[1]; break; }
  }

  return result;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isLikelyFormEncoded(rawBody: string) {
  const trimmed = rawBody.trim();
  return trimmed.includes("=") && !trimmed.startsWith("{") && !trimmed.startsWith("[");
}

function parsePayload(rawBody: string, contentType: string) {
  if (!rawBody) return {} as Record<string, unknown>;
  const normalizedType = contentType.toLowerCase();

  if (normalizedType.includes("application/json")) {
    const parsed = JSON.parse(rawBody);
    return typeof parsed === "string" ? { message: parsed } : parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  }

  if (normalizedType.includes("application/x-www-form-urlencoded") || (normalizedType.includes("text/plain") && isLikelyFormEncoded(rawBody)) || isLikelyFormEncoded(rawBody)) {
    return Object.fromEntries(new URLSearchParams(rawBody).entries());
  }

  try {
    const parsed = JSON.parse(rawBody);
    return typeof parsed === "string" ? { message: parsed } : parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return { message: rawBody };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const token = url.searchParams.get("token") || pathParts[pathParts.length - 1];

    if (!token || token === "store-sms") {
      return new Response(JSON.stringify({ error: "Missing webhook token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify token
    const { data: webhook, error: whError } = await supabaseAdmin.from("sms_webhooks").select("*").eq("token", token).eq("is_active", true).maybeSingle();
    if (whError || !webhook) {
      return new Response(JSON.stringify({ error: "Invalid or inactive webhook token" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rawBody = await req.text();
    const payload = parsePayload(rawBody, req.headers.get("content-type") || "");
    const senderHint = getString(payload.from) || getString(payload.sender) || url.searchParams.get("from") || "";
    const rawMessage = getString(payload.content) || getString(payload.message) || getString(payload.body) || getString(payload.text) || getString(payload.sms) || url.searchParams.get("content") || url.searchParams.get("message") || rawBody;

    if (!rawMessage.trim()) {
      return new Response(JSON.stringify({ error: "Missing SMS content" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = parseSms(String(rawMessage), senderHint);

    // Balance verification logic
    let status = "verified";
    const provider = parsed.sender;

    if (parsed.sms_balance !== null && (provider === "bKash" || provider === "Nagad")) {
      // Get current tracked balance
      const { data: tracker } = await supabaseAdmin.from("balance_tracker").select("*").eq("provider", provider).maybeSingle();

      if (tracker) {
        const expectedBalance = Number(tracker.last_balance) + parsed.amount;
        // Allow small tolerance (0.5 tk)
        if (Math.abs(parsed.sms_balance - expectedBalance) > 0.5) {
          // Balance mismatch → pending
          status = "pending";
        } else {
          // Balance matches → update tracker
          await supabaseAdmin.from("balance_tracker").update({ last_balance: parsed.sms_balance }).eq("provider", provider);
        }
      } else {
        // First time: just set the balance
        await supabaseAdmin.from("balance_tracker").upsert({ provider, last_balance: parsed.sms_balance, total_received: parsed.amount });
      }
    }

    const { error: insertError } = await supabaseAdmin.from("sms_messages").insert({
      webhook_id: webhook.id,
      sender: parsed.sender,
      phone_number: parsed.phone_number,
      transaction_id: parsed.transaction_id,
      amount: parsed.amount,
      sms_balance: parsed.sms_balance,
      status,
      raw_message: String(rawMessage),
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ status, parsed }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Store SMS error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
