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

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { product_id, package_id, game_id } = body;

    if (!product_id || !package_id || !game_id) throw new Error("Missing required fields");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get package price
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from("packages")
      .select("price")
      .eq("id", package_id)
      .single();
    if (pkgError || !pkg) throw new Error("Package not found");

    // Get wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (walletError || !wallet) throw new Error("Wallet not found");

    if (wallet.balance < pkg.price) throw new Error("Insufficient balance");

    // Deduct and create order atomically
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: wallet.balance - pkg.price })
      .eq("id", wallet.id);
    if (updateError) throw updateError;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        product_id,
        package_id,
        game_id,
        payment_method: "wallet",
        amount: pkg.price,
        status: "pending",
      })
      .select()
      .single();
    if (orderError) {
      // Rollback wallet
      await supabaseAdmin.from("wallets").update({ balance: wallet.balance }).eq("id", wallet.id);
      throw orderError;
    }

    return new Response(JSON.stringify({ success: true, order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
