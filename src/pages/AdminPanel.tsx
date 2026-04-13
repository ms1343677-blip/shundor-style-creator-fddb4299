import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard, Package, Layers, LogOut, Plus, Pencil, Trash2, Menu, X,
  ChevronRight, ShoppingCart, Check, XCircle, Settings, Image, Users, Bell, Palette, Save
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Tab = "dashboard" | "products" | "packages" | "orders" | "users" | "banners" | "settings";

const AdminPanel = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isReady, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("Game");
  const [pSubCategory, setPSubCategory] = useState("Top up");
  const [pImageUrl, setPImageUrl] = useState("");
  const [pSortOrder, setPSortOrder] = useState(0);

  const [pkgName, setPkgName] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgSortOrder, setPkgSortOrder] = useState(0);

  // Banner form
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerSortOrder, setBannerSortOrder] = useState(0);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isReady && !user) navigate("/login");
  }, [isReady, user, navigate]);

  // Queries
  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: packages } = useQuery({
    queryKey: ["admin-packages", selectedProductId],
    queryFn: async () => {
      let q = supabase.from("packages").select("*, products(name)").order("sort_order");
      if (selectedProductId) q = q.eq("product_id", selectedProductId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(name), packages(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: banners, refetch: refetchBanners } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: userRoles, refetch: refetchRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: wallets, refetch: refetchWallets } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profiles, refetch: refetchProfiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // User management state
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [addBalanceAmount, setAddBalanceAmount] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Load settings into form
  useEffect(() => {
    if (siteSettings) {
      const map: Record<string, string> = {};
      siteSettings.forEach((s: any) => { map[s.key] = s.value; });
      setSettingsForm(map);
    }
  }, [siteSettings]);

  // Mutations
  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload = { name: pName, category: pCategory, sub_category: pSubCategory, image_url: pImageUrl || null, sort_order: pSortOrder };
      if (editingProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); resetProductForm(); toast({ title: "সফল!" }); },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("products").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const toggleProduct = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("products").update({ is_active }).eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const savePackage = useMutation({
    mutationFn: async () => {
      if (!selectedProductId && !editingPackage) return;
      const payload = { name: pkgName, price: parseFloat(pkgPrice), sort_order: pkgSortOrder, product_id: editingPackage?.product_id || selectedProductId! };
      if (editingPackage) {
        const { error } = await supabase.from("packages").update(payload).eq("id", editingPackage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("packages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-packages"] }); resetPackageForm(); toast({ title: "সফল!" }); },
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("packages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const togglePackage = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("packages").update({ is_active }).eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => refetchOrders(),
  });

  const saveBanner = useMutation({
    mutationFn: async () => {
      const payload = { title: bannerTitle, image_url: bannerImageUrl, link_url: bannerLinkUrl, sort_order: bannerSortOrder };
      if (editingBanner) {
        const { error } = await supabase.from("banners").update(payload).eq("id", editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { refetchBanners(); resetBannerForm(); toast({ title: "সফল!" }); },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("banners").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => refetchBanners(),
  });

  const toggleBanner = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("banners").update({ is_active }).eq("id", id); if (error) throw error; },
    onSuccess: () => refetchBanners(),
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(settingsForm)) {
        const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "সেটিংস সেভ হয়েছে!" });
    },
  });

  const resetProductForm = () => { setEditingProduct(null); setPName(""); setPCategory("Game"); setPSubCategory("Top up"); setPImageUrl(""); setPSortOrder(0); };
  const resetPackageForm = () => { setEditingPackage(null); setPkgName(""); setPkgPrice(""); setPkgSortOrder(0); };
  const resetBannerForm = () => { setEditingBanner(null); setBannerTitle(""); setBannerImageUrl(""); setBannerLinkUrl(""); setBannerSortOrder(0); };

  const startEditProduct = (p: any) => { setEditingProduct(p); setPName(p.name); setPCategory(p.category); setPSubCategory(p.sub_category); setPImageUrl(p.image_url || ""); setPSortOrder(p.sort_order); };
  const startEditPackage = (p: any) => { setEditingPackage(p); setPkgName(p.name); setPkgPrice(String(p.price)); setPkgSortOrder(p.sort_order); };
  const startEditBanner = (b: any) => { setEditingBanner(b); setBannerTitle(b.title); setBannerImageUrl(b.image_url); setBannerLinkUrl(b.link_url || ""); setBannerSortOrder(b.sort_order); };

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin";

  const sidebarItems: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "packages", label: "Packages", icon: Layers },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "users", label: "Users", icon: Users },
    { id: "banners", label: "Banners", icon: Image },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const settingsFields = [
    { key: "site_name", label: "Site Name", type: "text" },
    { key: "notice_text", label: "Notice Text", type: "textarea" },
    { key: "notice_enabled", label: "Notice Enabled", type: "toggle" },
    { key: "whatsapp_number", label: "WhatsApp Number", type: "text" },
    { key: "telegram_link", label: "Telegram Link", type: "text" },
    { key: "facebook_link", label: "Facebook Link", type: "text" },
    { key: "support_hours", label: "Support Hours", type: "text" },
    { key: "primary_color", label: "Primary Color (HSL)", type: "color" },
    { key: "notice_color", label: "Notice Color (HSL)", type: "color" },
    { key: "nav_color", label: "Header Color (HSL)", type: "color" },
    { key: "footer_color", label: "Footer Color (HSL)", type: "color" },
  ];

  const colorPresets = [
    { label: "Green", value: "152 60% 30%" },
    { label: "Blue", value: "220 70% 50%" },
    { label: "Purple", value: "270 60% 50%" },
    { label: "Red", value: "0 70% 50%" },
    { label: "Orange", value: "25 90% 50%" },
    { label: "Teal", value: "180 60% 35%" },
    { label: "Pink", value: "330 70% 50%" },
    { label: "Dark", value: "220 30% 15%" },
  ];

  return (
    <div className="min-h-screen bg-muted flex">
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-nav text-nav-foreground flex flex-col transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-4 border-b border-nav-foreground/10">
          <h1 className="text-lg font-black"><span className="text-destructive">RG</span> BAZZER</h1>
          <p className="text-[10px] text-nav-foreground/50 mt-0.5">Admin Panel</p>
        </div>
        <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] ${activeTab === item.id ? "bg-primary text-primary-foreground font-semibold" : "text-nav-foreground/80 active:bg-nav-foreground/10"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-nav-foreground/10">
          <p className="text-[10px] text-nav-foreground/40 truncate mb-1">{user.email}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-[12px] text-nav-foreground/60 active:text-destructive">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen min-w-0">
        <header className="bg-card border-b border-border px-4 h-12 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="w-5 h-5 text-foreground" /></button>
          <h2 className="text-[15px] font-bold text-foreground capitalize">{activeTab}</h2>
          <span className="ml-auto text-[12px] text-muted-foreground">Hi, {displayName}</span>
        </header>

        <div className="p-3 sm:p-4 max-w-5xl">
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Products", value: products?.length || 0, color: "text-primary" },
                { label: "Active Products", value: products?.filter((p) => p.is_active).length || 0, color: "text-success" },
                { label: "Packages", value: packages?.length || 0, color: "text-accent" },
                { label: "Total Orders", value: orders?.length || 0, color: "text-primary" },
                { label: "Pending Orders", value: orders?.filter((o: any) => o.status === "pending").length || 0, color: "text-notice-foreground" },
                { label: "Users", value: wallets?.length || 0, color: "text-accent" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border p-4">
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* PRODUCTS */}
          {activeTab === "products" && (
            <div className="space-y-3">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingProduct ? "Edit Product" : "Add Product"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Name</label><Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Free Fire TopUp" className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Category</label><Input value={pCategory} onChange={(e) => setPCategory(e.target.value)} className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Sub Category</label><Input value={pSubCategory} onChange={(e) => setPSubCategory(e.target.value)} className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Image URL</label><Input value={pImageUrl} onChange={(e) => setPImageUrl(e.target.value)} className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Sort Order</label><Input type="number" value={pSortOrder} onChange={(e) => setPSortOrder(Number(e.target.value))} className="h-9 text-[13px]" /></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => saveProduct.mutate()} disabled={!pName} size="sm">{editingProduct ? "Update" : "Add"}</Button>
                  {editingProduct && <Button variant="outline" size="sm" onClick={resetProductForm}>Cancel</Button>}
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-bold text-foreground">All Products</h3></div>
                <div className="divide-y divide-border">
                  {products?.map((p) => (
                    <div key={p.id} className="px-4 py-2.5 flex items-center gap-2">
                      {p.image_url && <img src={p.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.category}</p>
                      </div>
                      <Switch checked={p.is_active} onCheckedChange={(v) => toggleProduct.mutate({ id: p.id, is_active: v })} />
                      <button onClick={() => startEditProduct(p)} className="p-1.5 active:bg-secondary rounded-lg"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => { setSelectedProductId(p.id); setActiveTab("packages"); }} className="p-1.5 active:bg-secondary rounded-lg"><ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deleteProduct.mutate(p.id)} className="p-1.5 active:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  ))}
                  {!products?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No products</div>}
                </div>
              </div>
            </div>
          )}

          {/* PACKAGES */}
          {activeTab === "packages" && (
            <div className="space-y-3">
              <div className="bg-card rounded-xl border border-border p-4">
                <label className="text-[11px] text-muted-foreground mb-1 block">Filter by Product</label>
                <select value={selectedProductId || ""} onChange={(e) => setSelectedProductId(e.target.value || null)} className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-card text-foreground">
                  <option value="">All Products</option>
                  {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {selectedProductId && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> {editingPackage ? "Edit Package" : "Add Package"}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Name</label><Input value={pkgName} onChange={(e) => setPkgName(e.target.value)} className="h-9 text-[13px]" /></div>
                    <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Price</label><Input type="number" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} className="h-9 text-[13px]" /></div>
                    <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Sort</label><Input type="number" value={pkgSortOrder} onChange={(e) => setPkgSortOrder(Number(e.target.value))} className="h-9 text-[13px]" /></div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => savePackage.mutate()} disabled={!pkgName || !pkgPrice} size="sm">{editingPackage ? "Update" : "Add"}</Button>
                    {editingPackage && <Button variant="outline" size="sm" onClick={resetPackageForm}>Cancel</Button>}
                  </div>
                </div>
              )}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-bold text-foreground">Packages</h3></div>
                <div className="divide-y divide-border">
                  {packages?.map((pkg: any) => (
                    <div key={pkg.id} className="px-4 py-2.5 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{pkg.name}</p>
                        <p className="text-[10px] text-muted-foreground">{pkg.products?.name}</p>
                      </div>
                      <span className="text-[13px] font-bold text-primary">৳{pkg.price}</span>
                      <Switch checked={pkg.is_active} onCheckedChange={(v) => togglePackage.mutate({ id: pkg.id, is_active: v })} />
                      <button onClick={() => startEditPackage(pkg)} className="p-1.5 active:bg-secondary rounded-lg"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deletePackage.mutate(pkg.id)} className="p-1.5 active:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  ))}
                  {!packages?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">{selectedProductId ? "No packages" : "Select a product"}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === "orders" && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-bold text-foreground">All Orders</h3></div>
              <div className="divide-y divide-border">
                {orders?.map((order: any) => (
                  <div key={order.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">{order.products?.name} — {order.packages?.name}</p>
                        <p className="text-[10px] text-muted-foreground">Game ID: {order.game_id} · ৳{order.amount} · {order.payment_method}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${
                        order.status === "completed" ? "bg-success/15 text-success" :
                        order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                        order.status === "processing" ? "bg-primary/10 text-primary" :
                        "bg-notice/20 text-notice-foreground"
                      }`}>{order.status}</span>
                      {order.status === "pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => updateOrderStatus.mutate({ id: order.id, status: "completed" })} className="p-1.5 active:bg-success/10 rounded-lg"><Check className="w-4 h-4 text-success" /></button>
                          <button onClick={() => updateOrderStatus.mutate({ id: order.id, status: "cancelled" })} className="p-1.5 active:bg-destructive/10 rounded-lg"><XCircle className="w-4 h-4 text-destructive" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!orders?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No orders</div>}
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === "users" && (
            <div className="space-y-3">
              {/* Search */}
              <div className="bg-card rounded-xl border border-border p-3">
                <Input
                  placeholder="Search by email or name..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="h-9 text-[13px]"
                />
              </div>

              {/* User detail panel */}
              {selectedUser && (() => {
                const profile = profiles?.find((p: any) => p.user_id === selectedUser);
                const wallet = wallets?.find((w: any) => w.user_id === selectedUser);
                const role = userRoles?.find((r: any) => r.user_id === selectedUser);
                const userOrders = orders?.filter((o: any) => o.user_id === selectedUser) || [];
                return (
                  <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-foreground">User Details</h3>
                      <button onClick={() => setSelectedUser(null)} className="text-muted-foreground active:opacity-60"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <div className="bg-secondary rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground">Email</p>
                        <p className="font-semibold text-foreground truncate">{profile?.email || "N/A"}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground">Name</p>
                        <p className="font-semibold text-foreground">{profile?.full_name || "N/A"}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground">Balance</p>
                        <p className="font-bold text-primary">৳{wallet?.balance || 0}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground">Role</p>
                        <p className="font-semibold text-foreground">{role?.role || "user"}</p>
                      </div>
                    </div>

                    {/* Add Balance */}
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Add Balance</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Amount" value={addBalanceAmount} onChange={(e) => setAddBalanceAmount(e.target.value)} className="h-9 text-[13px] flex-1" />
                        <Button size="sm" onClick={async () => {
                          const amt = parseFloat(addBalanceAmount);
                          if (!amt || amt <= 0) return;
                          try {
                            const { data, error } = await supabase.functions.invoke("admin-user", {
                              body: { action: "add_balance", user_id: selectedUser, amount: amt },
                            });
                            if (error) throw error;
                            if (data?.error) throw new Error(data.error);
                            toast({ title: `৳${amt} added!` });
                            setAddBalanceAmount("");
                            refetchWallets();
                          } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
                        }}>Add</Button>
                      </div>
                    </div>

                    {/* Change Role */}
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Change Role</label>
                      <div className="flex gap-1.5">
                        {(["user", "admin", "moderator"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke("admin-user", {
                                  body: { action: "set_role", user_id: selectedUser, role: r === "user" ? "remove" : r },
                                });
                                if (error) throw error;
                                if (data?.error) throw new Error(data.error);
                                toast({ title: `Role set to ${r}` });
                                refetchRoles();
                              } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
                            }}
                            className={`h-8 px-3 rounded-lg text-[11px] font-bold border active:opacity-75 ${
                              (role?.role === r || (!role && r === "user"))
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground"
                            }`}
                          >{r}</button>
                        ))}
                      </div>
                    </div>

                    {/* User Orders */}
                    {userOrders.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Orders ({userOrders.length})</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {userOrders.map((o: any) => (
                            <div key={o.id} className="bg-secondary rounded-lg px-3 py-2 flex items-center justify-between text-[11px]">
                              <span className="text-foreground font-medium truncate">{o.products?.name} · ৳{o.amount}</span>
                              <span className={`font-bold ${o.status === "completed" ? "text-success" : o.status === "cancelled" ? "text-destructive" : "text-notice-foreground"}`}>{o.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* User List */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <h3 className="text-[13px] font-bold text-foreground">All Users ({profiles?.length || wallets?.length || 0})</h3>
                </div>
                <div className="divide-y divide-border">
                  {(profiles || [])
                    .filter((p: any) => {
                      if (!userSearchQuery) return true;
                      const q = userSearchQuery.toLowerCase();
                      return (p.email || "").toLowerCase().includes(q) || (p.full_name || "").toLowerCase().includes(q);
                    })
                    .map((p: any) => {
                      const wallet = wallets?.find((w: any) => w.user_id === p.user_id);
                      const role = userRoles?.find((r: any) => r.user_id === p.user_id);
                      const isSelected = selectedUser === p.user_id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedUser(isSelected ? null : p.user_id)}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 active:bg-secondary ${isSelected ? "bg-primary/5" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shrink-0">
                            {(p.full_name || p.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-foreground truncate">{p.full_name || p.email?.split("@")[0] || "User"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                          </div>
                          <span className="text-[11px] font-bold text-primary shrink-0">৳{wallet?.balance || 0}</span>
                          {role && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold shrink-0">{role.role}</span>}
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                        </button>
                      );
                    })}
                  {!profiles?.length && !wallets?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No users</div>}
                </div>
              </div>
            </div>
          )}

          {/* BANNERS */}
          {activeTab === "banners" && (
            <div className="space-y-3">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingBanner ? "Edit Banner" : "Add Banner"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Title</label><Input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Image URL</label><Input value={bannerImageUrl} onChange={(e) => setBannerImageUrl(e.target.value)} className="h-9 text-[13px]" placeholder="https://..." /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Link URL</label><Input value={bannerLinkUrl} onChange={(e) => setBannerLinkUrl(e.target.value)} className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Sort Order</label><Input type="number" value={bannerSortOrder} onChange={(e) => setBannerSortOrder(Number(e.target.value))} className="h-9 text-[13px]" /></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => saveBanner.mutate()} disabled={!bannerImageUrl} size="sm">{editingBanner ? "Update" : "Add"}</Button>
                  {editingBanner && <Button variant="outline" size="sm" onClick={resetBannerForm}>Cancel</Button>}
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-bold text-foreground">All Banners</h3></div>
                <div className="divide-y divide-border">
                  {banners?.map((b: any) => (
                    <div key={b.id} className="px-4 py-2.5 flex items-center gap-3">
                      <img src={b.image_url} alt={b.title} className="w-16 h-10 rounded-lg object-cover bg-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{b.title || "Untitled"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{b.image_url}</p>
                      </div>
                      <Switch checked={b.is_active} onCheckedChange={(v) => toggleBanner.mutate({ id: b.id, is_active: v })} />
                      <button onClick={() => startEditBanner(b)} className="p-1.5 active:bg-secondary rounded-lg"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deleteBanner.mutate(b.id)} className="p-1.5 active:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  ))}
                  {!banners?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No banners</div>}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-3">
              {/* General Settings */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4" /> General Settings
                </h3>
                <div className="space-y-3">
                  {settingsFields.filter(f => f.type !== "color" && f.type !== "toggle").map((field) => (
                    <div key={field.key}>
                      <label className="text-[11px] text-muted-foreground mb-0.5 block">{field.label}</label>
                      {field.type === "textarea" ? (
                        <Textarea
                          value={settingsForm[field.key] || ""}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="text-[13px] min-h-[60px]"
                        />
                      ) : (
                        <Input
                          value={settingsForm[field.key] || ""}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="h-9 text-[13px]"
                        />
                      )}
                    </div>
                  ))}
                  {/* Toggle fields */}
                  {settingsFields.filter(f => f.type === "toggle").map((field) => (
                    <div key={field.key} className="flex items-center justify-between py-1">
                      <label className="text-[12px] font-medium text-foreground">{field.label}</label>
                      <Switch
                        checked={settingsForm[field.key] === "true"}
                        onCheckedChange={(v) => setSettingsForm(prev => ({ ...prev, [field.key]: String(v) }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Colors */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Theme Colors
                </h3>
                {settingsFields.filter(f => f.type === "color").map((field) => (
                  <div key={field.key} className="mb-3">
                    <label className="text-[11px] text-muted-foreground mb-1 block">{field.label}</label>
                    <Input
                      value={settingsForm[field.key] || ""}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="h-9 text-[13px] mb-1.5"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {colorPresets.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setSettingsForm(prev => ({ ...prev, [field.key]: c.value }))}
                          className={`h-7 px-2.5 rounded-md text-[10px] font-semibold border active:opacity-75 ${
                            settingsForm[field.key] === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                          }`}
                        >
                          <span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ background: `hsl(${c.value})` }} />
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save button */}
              <Button onClick={() => saveSettings.mutate()} className="w-full" disabled={saveSettings.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveSettings.isPending ? "Saving..." : "Save All Settings"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
