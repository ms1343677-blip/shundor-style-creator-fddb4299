import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Parse bKash SMS: "You have received Tk 100.00 from 01XXXXXXXXX. Ref: TrxID XXXXXXXXXX..."
// Parse Nagad SMS: "You have received Tk 100.00 from 01XXXXXXXXX. TxnID XXXXXXXXXX..."
function parseSms(message: string) {
  const result = { sender: "", phone_number: "", transaction_id: "", amount: 0 };

  // Detect sender
  const msg = message.toUpperCase();
  if (msg.includes("BKASH") || msg.includes("BKA")) result.sender = "bKash";
  else if (msg.includes("NAGAD")) result.sender = "Nagad";
  else if (msg.includes("ROCKET")) result.sender = "Rocket";
  else result.sender = "Unknown";

  // Extract amount - various patterns
  const amountPatterns = [
    /Tk\s*([\d,]+\.?\d*)/i,
    /BDT\s*([\d,]+\.?\d*)/i,
    /Taka\s*([\d,]+\.?\d*)/i,
    /amount\s*:?\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:Tk|BDT|Taka)/i,
  ];
  for (const pat of amountPatterns) {
    const m = message.match(pat);
    if (m) { result.amount = parseFloat(m[1].replace(/,/g, "")); break; }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Extract token from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    // Token can be in query param or path
    const token = url.searchParams.get("token") || pathParts[pathParts.length - 1];

    if (!token || token === "store-sms") {
      return new Response(JSON.stringify({ error: "Missing webhook token" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify token
    const { data: webhook, error: whError } = await supabaseAdmin
      .from("sms_webhooks")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (whError || !webhook) {
      return new Response(JSON.stringify({ error: "Invalid or inactive webhook token" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const rawMessage = typeof body === "string" ? body : (body.message || body.body || body.text || body.sms || JSON.stringify(body));

    const parsed = parseSms(String(rawMessage));

    const { error: insertError } = await supabaseAdmin.from("sms_messages").insert({
      webhook_id: webhook.id,
      sender: parsed.sender,
      phone_number: parsed.phone_number,
      transaction_id: parsed.transaction_id,
      amount: parsed.amount,
      raw_message: String(rawMessage),
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ status: "stored", parsed }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Store SMS error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
});
