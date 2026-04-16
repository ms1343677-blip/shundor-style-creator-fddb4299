import { useState, useEffect, useCallback } from "react";
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

  const buildAppUser = useCallback(async (authUser: any) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .eq("role", "admin")
      .maybeSingle();

    const appUser: AppUser = {
      id: authUser.id,
      email: authUser.email || "",
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      is_admin: !!roleData,
      avatar_url: authUser.user_metadata?.avatar_url || null,
    };
    setUser(appUser);
  }, []);

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        buildAppUser(session.user).finally(() => setIsReady(true));
      } else {
        setIsReady(true);
      }
    });

    // Listen for auth changes - DO NOT await inside callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid deadlock - never await inside onAuthStateChange
        setTimeout(() => {
          buildAppUser(session.user);
        }, 0);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [buildAppUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, isReady, signOut };
}
