import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export type SiteSettings = Record<string, string>;

export function useSiteSettings() {
  const { data: settings, ...rest } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");
      if (error) throw error;
      const map: SiteSettings = {};
      data?.forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
    staleTime: 60_000,
  });

  // Apply dynamic CSS variables, title, favicon
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.background_color) root.style.setProperty("--background", settings.background_color);
    if (settings.primary_color) root.style.setProperty("--primary", settings.primary_color);
    if (settings.notice_color) root.style.setProperty("--notice-bg", settings.notice_color);
    if (settings.nav_color) {
      root.style.setProperty("--nav-bg", settings.nav_color);
      root.style.setProperty("--footer-bg", settings.nav_color);
    }
    if (settings.footer_color) root.style.setProperty("--footer-bg", settings.footer_color);

    // Dynamic page title
    if (settings.site_name) document.title = settings.site_name;

    // Dynamic meta description
    if (settings.meta_description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (meta) meta.content = settings.meta_description;
    }

    // Dynamic favicon
    if (settings.favicon_url) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }

    return () => {
      root.style.removeProperty("--background");
      root.style.removeProperty("--primary");
      root.style.removeProperty("--notice-bg");
      root.style.removeProperty("--nav-bg");
      root.style.removeProperty("--footer-bg");
    };
  }, [settings]);

  return { settings: settings || {}, ...rest };
}
