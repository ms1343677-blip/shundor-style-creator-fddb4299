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
  { value: "freefire", label: "FreeFire Server", endpoint: "Direct URL (Bearer Token)" },
  { value: "humayun", label: "Humayun", endpoint: "/webhook/humayun/order" },
];

const AutoApiTab = ({ user }: { user: any }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiType, setApiType] = useState("freefire");

  const { data: autoApis, refetch } = useQuery({
    queryKey: ["admin-auto-apis"],
    queryFn: async () => {
      const { data } = await supabase.from("auto_apis").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const resetForm = () => { setEditing(null); setName(""); setBaseUrl(""); setApiKey(""); setApiType("freefire"); };
  const startEdit = (a: any) => { setEditing(a); setName(a.name); setBaseUrl(a.base_url); setApiKey(a.api_key); setApiType(a.api_type || "freefire"); };

  const save = async () => {
    try {
      if (editing) {
        await supabase.from("auto_apis").update({ name, base_url: baseUrl, api_key: apiKey, api_type: apiType }).eq("id", editing.id);
      } else {
        await supabase.from("auto_apis").insert({ name, base_url: baseUrl, api_key: apiKey, api_type: apiType });
      }
      resetForm(); refetch(); toast({ title: "সফল!" });
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const remove = async (id: string) => {
    try { await supabase.from("auto_apis").delete().eq("id", id); refetch(); } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const getTypeInfo = (type: string) => API_TYPES.find(t => t.value === type) || API_TYPES[0];

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {editing ? "Edit Auto API" : "Add Auto API"}
        </h3>
        <div className="space-y-2">
          <div><label className="text-[11px] text-muted-foreground mb-0.5 block">API Name</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Free Fire Unipin Topup" className="h-9 text-[13px]" /></div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-0.5 block">API Type</label>
            <Select value={apiType} onValueChange={setApiType}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>{API_TYPES.map(t => <SelectItem key={t.value} value={t.value}><span>{t.label}</span></SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Server URL</label><Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="h-9 text-[13px]" /></div>
          <div><label className="text-[11px] text-muted-foreground mb-0.5 block">API Key / Bearer Token</label><Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="h-9 text-[13px]" type="password" /></div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={save} disabled={!name || !baseUrl} size="sm"><Save className="w-3.5 h-3.5 mr-1" /> {editing ? "Update" : "Add"}</Button>
          {editing && <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-bold text-foreground">All Auto APIs ({autoApis?.length || 0})</h3></div>
        <div className="divide-y divide-border">
          {autoApis?.map((a: any) => {
            const typeInfo = getTypeInfo(a.api_type || "freefire");
            return (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-[13px] font-bold text-foreground flex-1">{a.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">{typeInfo.label}</span>
                  <button onClick={() => startEdit(a)} className="p-1.5 active:bg-secondary rounded-lg"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => remove(a.id)} className="p-1.5 active:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <p className="flex items-center gap-1"><Globe className="w-3 h-3" /> {a.base_url}</p>
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
