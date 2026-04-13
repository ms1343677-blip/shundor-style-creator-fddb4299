import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
    }

    const { action, user_id, amount, role } = await req.json();

    if (action === "add_balance") {
      if (!user_id || !amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400, headers: corsHeaders });
      }
      // Get current balance
      const { data: wallet, error: wErr } = await adminClient
        .from("wallets")
        .select("balance")
        .eq("user_id", user_id)
        .single();
      if (wErr) throw wErr;

      const newBalance = (wallet?.balance || 0) + amount;
      const { error: uErr } = await adminClient
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", user_id);
      if (uErr) throw uErr;

      return new Response(JSON.stringify({ success: true, balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_role") {
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400, headers: corsHeaders });
      }
      if (role === "remove") {
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
      } else {
        // Upsert role
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        const { error: rErr } = await adminClient.from("user_roles").insert({ user_id, role });
        if (rErr) throw rErr;
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_profile") {
      const { full_name } = await req.json().catch(() => ({}));
      if (!user_id) {
        return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400, headers: corsHeaders });
      }
      const updates: any = {};
      if (full_name !== undefined) updates.full_name = full_name;
      
      const { error: pErr } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("user_id", user_id);
      if (pErr) throw pErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
