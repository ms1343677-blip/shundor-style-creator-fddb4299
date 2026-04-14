import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Globe, Key, Save, Tag } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API_TYPES = [
  { value: "automation", label: "Automation (Default)", endpoint: "/webhook/website/order" },
  { value: "humayun", label: "Humayun", endpoint: "/webhook/humayun/order" },
  { value: "freefire", label: "FreeFire Server", endpoint: "Direct URL (Bearer Token)" },
];

const AutoApiTab = ({ user }: { user: any }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiType, setApiType] = useState("automation");

  const { data: autoApis, refetch } = useQuery({
    queryKey: ["admin-auto-apis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("auto_apis").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const resetForm = () => { setEditing(null); setName(""); setBaseUrl(""); setApiKey(""); setApiType("automation"); };

  const startEdit = (api: any) => {
    setEditing(api);
    setName(api.name);
    setBaseUrl(api.base_url);
    setApiKey(api.api_key);
    setApiType((api as any).api_type || "automation");
  };

  const save = async () => {
    const payload = { name, base_url: baseUrl, api_key: apiKey, api_type: apiType } as any;
    if (editing) {
      const { error } = await supabase.from("auto_apis").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("auto_apis").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    resetForm();
    refetch();
    queryClient.invalidateQueries({ queryKey: ["admin-auto-apis"] });
    toast({ title: "সফল!" });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("auto_apis").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetch();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("auto_apis").update({ is_active }).eq("id", id);
    refetch();
  };

  const getTypeInfo = (type: string) => API_TYPES.find(t => t.value === type) || API_TYPES[0];

  return (
    <div className="space-y-3">
      {/* Form */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {editing ? "Edit Auto API" : "Add Auto API"}
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-0.5 block">API Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Free Fire Unipin Topup" className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-0.5 block">API Type</label>
            <Select value={apiType} onValueChange={setApiType}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {API_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex flex-col">
                      <span>{t.label}</span>
                      <span className="text-[10px] text-muted-foreground">{t.endpoint}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-0.5 block">Website API URL</label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="oktopupbd.com" className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-0.5 block">Website API Key</label>
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key" className="h-9 text-[13px]" type="password" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={save} disabled={!name || !baseUrl} size="sm">
            <Save className="w-3.5 h-3.5 mr-1" /> {editing ? "Update" : "Add"}
          </Button>
          {editing && <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>}
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h3 className="text-[13px] font-bold text-foreground">All Auto APIs ({autoApis?.length || 0})</h3>
        </div>
        <div className="divide-y divide-border">
          {autoApis?.map((api: any) => {
            const typeInfo = getTypeInfo(api.api_type || "automation");
            return (
              <div key={api.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-[13px] font-bold text-foreground flex-1">{api.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">
                    {typeInfo.label}
                  </span>
                  <Switch checked={api.is_active} onCheckedChange={(v) => toggle(api.id, v)} />
                  <button onClick={() => startEdit(api)} className="p-1.5 active:bg-secondary rounded-lg">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => remove(api.id)} className="p-1.5 active:bg-destructive/10 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <p className="flex items-center gap-1"><Globe className="w-3 h-3" /> {api.base_url}</p>
                  <p className="flex items-center gap-1"><Tag className="w-3 h-3" /> Endpoint: {typeInfo.endpoint}</p>
                  <p className="flex items-center gap-1"><Key className="w-3 h-3" /> {"•".repeat(20)}</p>
                </div>
              </div>
            );
          })}
          {!autoApis?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No Auto APIs configured</div>}
        </div>
      </div>
    </div>
  );
};

export default AutoApiTab;
