import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Globe, Palette, MessageSquare, CreditCard, Save, Loader2, Shield, Image, Bell
} from "lucide-react";

type SettingsSection = "general" | "social" | "payment" | "theme" | "seo";

const sections: { id: SettingsSection; label: string; icon: any; description: string }[] = [
  { id: "general", label: "General", icon: Globe, description: "সাইটের নাম, লোগো, নোটিশ" },
  { id: "seo", label: "SEO & Meta", icon: Shield, description: "Meta, Copyright, Favicon" },
  { id: "social", label: "Social Links", icon: MessageSquare, description: "WhatsApp, Telegram, Facebook" },
  { id: "payment", label: "Payment", icon: CreditCard, description: "bKash, Nagad, API Keys" },
  { id: "theme", label: "Theme Colors", icon: Palette, description: "কালার কাস্টমাইজ করুন" },
];

const sectionFields: Record<SettingsSection, { key: string; label: string; type: "text" | "textarea" | "toggle" | "color" }[]> = {
  general: [
    { key: "site_name", label: "Site Name", type: "text" },
    { key: "logo_url", label: "Logo URL", type: "text" },
    { key: "notice_text", label: "Notice Text", type: "textarea" },
    { key: "notice_enabled", label: "Notice Bar চালু করুন", type: "toggle" },
    { key: "support_hours", label: "Support Hours", type: "text" },
  ],
  seo: [
    { key: "meta_description", label: "Meta Description", type: "textarea" },
    { key: "favicon_url", label: "Favicon URL", type: "text" },
    { key: "copyright_text", label: "Copyright Text", type: "text" },
  ],
  social: [
    { key: "whatsapp_number", label: "WhatsApp Number", type: "text" },
    { key: "telegram_link", label: "Telegram Link", type: "text" },
    { key: "facebook_link", label: "Facebook Page Link", type: "text" },
  ],
  payment: [
    { key: "bkash_number", label: "bKash Number", type: "text" },
    { key: "nagad_number", label: "Nagad Number", type: "text" },
    { key: "google_client_id", label: "Google Client ID (OAuth)", type: "text" },
    { key: "uddoktapay_api_url", label: "UddoktaPay API URL", type: "text" },
  ],
  theme: [
    { key: "background_color", label: "Background Color (HSL)", type: "color" },
    { key: "primary_color", label: "Primary Color (HSL)", type: "color" },
    { key: "notice_color", label: "Notice Bar Color (HSL)", type: "color" },
    { key: "nav_color", label: "Header/Nav Color (HSL)", type: "color" },
    { key: "footer_color", label: "Footer Color (HSL)", type: "color" },
  ],
};

const colorPresets = [
  { label: "White", value: "0 0% 100%" },
  { label: "Light", value: "0 0% 95%" },
  { label: "Green", value: "145 63% 32%" },
  { label: "Blue", value: "220 70% 50%" },
  { label: "Purple", value: "270 60% 50%" },
  { label: "Red", value: "0 70% 50%" },
  { label: "Orange", value: "25 90% 50%" },
  { label: "Teal", value: "180 60% 35%" },
  { label: "Dark", value: "220 30% 15%" },
];

const AdminSettingsTab = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (siteSettings) {
      const map: Record<string, string> = {};
      siteSettings.forEach((s: any) => { map[s.key] = s.value; });
      setSettingsForm(map);
    }
  }, [siteSettings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(settingsForm)) {
        // Try update first, if no rows affected, insert
        const { error: updateError, count } = await supabase
          .from("site_settings")
          .update({ value })
          .eq("key", key)
          .select();
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "✅ সেটিংস সেভ হয়েছে!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const fields = sectionFields[activeSection];

  return (
    <div className="space-y-3">
      {/* Section Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 border transition-colors ${
              activeSection === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border active:bg-secondary"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Section Header */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          {(() => { const Icon = sections.find(s => s.id === activeSection)?.icon || Globe; return <Icon className="w-4 h-4 text-primary" />; })()}
          <h3 className="text-[14px] font-bold text-foreground">
            {sections.find(s => s.id === activeSection)?.label}
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {sections.find(s => s.id === activeSection)?.description}
        </p>
      </div>

      {/* Fields */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        {fields.map((field) => {
          if (field.type === "toggle") {
            return (
              <div key={field.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <label className="text-[12px] font-semibold text-foreground">{field.label}</label>
                  <p className="text-[10px] text-muted-foreground">{field.key}</p>
                </div>
                <Switch
                  checked={settingsForm[field.key] === "true"}
                  onCheckedChange={(v) => setSettingsForm(prev => ({ ...prev, [field.key]: String(v) }))}
                />
              </div>
            );
          }

          if (field.type === "color") {
            return (
              <div key={field.key} className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground">{field.label}</label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-border shrink-0"
                    style={{ background: settingsForm[field.key] ? `hsl(${settingsForm[field.key]})` : '#ccc' }}
                  />
                  <Input
                    value={settingsForm[field.key] || ""}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="220 70% 50%"
                    className="h-9 text-[13px] font-mono flex-1"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {colorPresets.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSettingsForm(prev => ({ ...prev, [field.key]: c.value }))}
                      className={`h-6 px-2 rounded-md text-[9px] font-semibold border active:opacity-75 flex items-center gap-1 ${
                        settingsForm[field.key] === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: `hsl(${c.value})` }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={field.key}>
              <label className="text-[11px] font-semibold text-foreground mb-0.5 block">{field.label}</label>
              {field.type === "textarea" ? (
                <Textarea
                  value={settingsForm[field.key] || ""}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="text-[13px] min-h-[60px]"
                  placeholder={field.label}
                />
              ) : (
                <Input
                  value={settingsForm[field.key] || ""}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="h-9 text-[13px]"
                  placeholder={field.label}
                />
              )}
              <p className="text-[9px] text-muted-foreground mt-0.5">key: {field.key}</p>
            </div>
          );
        })}
      </div>

      {/* Logo Preview */}
      {activeSection === "general" && settingsForm.logo_url && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-[11px] text-muted-foreground mb-2">Logo Preview</p>
          <img src={settingsForm.logo_url} alt="Logo" className="h-12 object-contain rounded-lg" />
        </div>
      )}

      {/* Save */}
      <Button
        onClick={() => saveSettings.mutate()}
        className="w-full"
        disabled={saveSettings.isPending}
      >
        {saveSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        {saveSettings.isPending ? "সেভ হচ্ছে..." : "সব সেটিংস সেভ করুন"}
      </Button>
    </div>
  );
};

export default AdminSettingsTab;
