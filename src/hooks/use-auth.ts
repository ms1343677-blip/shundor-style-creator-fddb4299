import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(api.getStoredUser());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setIsReady(true);
      return;
    }
    api.getMe()
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
      })
      .catch(() => {
        api.logout();
        setUser(null);
      })
      .finally(() => setIsReady(true));
  }, []);

  const signOut = () => {
    api.logout();
    setUser(null);
  };

  return { user, isReady, signOut };
}
