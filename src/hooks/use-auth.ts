import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        // Check admin role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.id)
          .eq("role", "admin")
          .maybeSingle();

        const appUser: AppUser = {
          id: u.id,
          email: u.email || "",
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          is_admin: !!roleData,
          avatar_url: u.user_metadata?.avatar_url || null,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsReady(true);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.id)
          .eq("role", "admin")
          .maybeSingle();

        setUser({
          id: u.id,
          email: u.email || "",
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          is_admin: !!roleData,
          avatar_url: u.user_metadata?.avatar_url || null,
        });
      }
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, isReady, signOut };
}
