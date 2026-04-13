const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getTargetPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();

  if (normalized.endsWith("/automation/webhook")) {
    return "/auto-topup-webhook/automation";
  }

  if (normalized.endsWith("/humayun/webhook")) {
    return "/auto-topup-webhook/humayun";
  }

  if (normalized.endsWith("/auto-topup/webhook")) {
    return "/auto-topup-webhook";
  }

  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetPath = getTargetPath(url.pathname);

    if (!targetPath) {
      return jsonResponse({
        error: "Unknown API route",
        available_routes: ["/automation/webhook", "/humayun/webhook", "/auto-topup/webhook"],
      }, 404);
    }

    const bodyText = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
    const targetUrl = `${SUPABASE_URL}/functions/v1${targetPath}${url.search}`;

    console.log("API alias forwarding request:", { from: url.pathname, to: targetUrl });

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/json",
        ...(SUPABASE_ANON_KEY
          ? {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            }
          : {}),
      },
      body: bodyText,
    });

    const responseText = await response.text();

    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("API alias error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
