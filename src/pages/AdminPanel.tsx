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
  ChevronRight, ShoppingCart, Check, XCircle, Settings, Image, Users, Bell, Palette, Save, FolderOpen, MessageSquare, RefreshCw, Copy, Eye, Wallet, RotateCcw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Tab = "dashboard" | "categories" | "products" | "packages" | "orders" | "users" | "banners" | "settings" | "webhook-sms" | "payment";

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
  const [pCategoryId, setPCategoryId] = useState("");
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

  // Category form
  const [catName, setCatName] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catSortOrder, setCatSortOrder] = useState(0);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isReady && !user) navigate("/login");
  }, [isReady, user, navigate]);

  // Queries
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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

  // Category mutations
  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = { name: catName, image_url: catImageUrl || null, sort_order: catSortOrder };
      if (editingCategory) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); resetCategoryForm(); toast({ title: "সফল!" }); },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
  });

  const toggleCategory = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("categories").update({ is_active }).eq("id", id); if (error) throw error; },
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
  });

  const resetCategoryForm = () => { setEditingCategory(null); setCatName(""); setCatImageUrl(""); setCatSortOrder(0); };
  const startEditCategory = (c: any) => { setEditingCategory(c); setCatName(c.name); setCatImageUrl(c.image_url || ""); setCatSortOrder(c.sort_order); };

  // Product mutations
  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload: any = { name: pName, sub_category: pSubCategory, image_url: pImageUrl || null, sort_order: pSortOrder, category_id: pCategoryId || null };
      // Keep old category text for backward compat
      const selectedCat = categories?.find((c: any) => c.id === pCategoryId);
      payload.category = selectedCat?.name || "Other";
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

  const resetProductForm = () => { setEditingProduct(null); setPName(""); setPCategoryId(""); setPSubCategory("Top up"); setPImageUrl(""); setPSortOrder(0); };
  const resetPackageForm = () => { setEditingPackage(null); setPkgName(""); setPkgPrice(""); setPkgSortOrder(0); };
  const resetBannerForm = () => { setEditingBanner(null); setBannerTitle(""); setBannerImageUrl(""); setBannerLinkUrl(""); setBannerSortOrder(0); };

  const startEditProduct = (p: any) => { setEditingProduct(p); setPName(p.name); setPCategoryId(p.category_id || ""); setPSubCategory(p.sub_category); setPImageUrl(p.image_url || ""); setPSortOrder(p.sort_order); };
  const startEditPackage = (p: any) => { setEditingPackage(p); setPkgName(p.name); setPkgPrice(String(p.price)); setPkgSortOrder(p.sort_order); };
  const startEditBanner = (b: any) => { setEditingBanner(b); setBannerTitle(b.title); setBannerImageUrl(b.image_url); setBannerLinkUrl(b.link_url || ""); setBannerSortOrder(b.sort_order); };

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin";

  const sidebarItems: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "categories", label: "Categories", icon: FolderOpen },
    { id: "products", label: "Products", icon: Package },
    { id: "packages", label: "Packages", icon: Layers },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "users", label: "Users", icon: Users },
    { id: "banners", label: "Banners", icon: Image },
    { id: "webhook-sms", label: "Webhook SMS", icon: MessageSquare },
    { id: "payment", label: "Payment", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const settingsFields = [
    { key: "site_name", label: "Site Name", type: "text" },
    { key: "notice_text", label: "Notice Text", type: "textarea" },
    { key: "notice_enabled", label: "Notice Enabled", type: "toggle" },
    { key: "whatsapp_number", label: "WhatsApp Number", type: "text" },
    { key: "telegram_link", label: "Telegram Link", type: "text" },
    { key: "facebook_link", label: "Facebook Link", type: "text" },
    { key: "bkash_number", label: "bKash Number", type: "text" },
    { key: "nagad_number", label: "Nagad Number", type: "text" },
    { key: "support_hours", label: "Support Hours", type: "text" },
    { key: "background_color", label: "Background Color (HSL)", type: "color" },
    { key: "primary_color", label: "Primary Color (HSL)", type: "color" },
    { key: "notice_color", label: "Notice Color (HSL)", type: "color" },
    { key: "nav_color", label: "Header Color (HSL)", type: "color" },
    { key: "footer_color", label: "Footer Color (HSL)", type: "color" },
  ];

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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId || !categories) return "—";
    const cat = categories.find((c: any) => c.id === categoryId);
    return cat?.name || "—";
  };

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
                { label: "Categories", value: categories?.length || 0, color: "text-accent" },
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

          {/* CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-3">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingCategory ? "Edit Category" : "Add Category"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Name</label><Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Game" className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Image URL</label><Input value={catImageUrl} onChange={(e) => setCatImageUrl(e.target.value)} className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Sort Order</label><Input type="number" value={catSortOrder} onChange={(e) => setCatSortOrder(Number(e.target.value))} className="h-9 text-[13px]" /></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => saveCategory.mutate()} disabled={!catName} size="sm">{editingCategory ? "Update" : "Add"}</Button>
                  {editingCategory && <Button variant="outline" size="sm" onClick={resetCategoryForm}>Cancel</Button>}
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-bold text-foreground">All Categories</h3></div>
                <div className="divide-y divide-border">
                  {categories?.map((c: any) => (
                    <div key={c.id} className="px-4 py-2.5 flex items-center gap-2">
                      {c.image_url && <img src={c.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">Sort: {c.sort_order}</p>
                      </div>
                      <Switch checked={c.is_active} onCheckedChange={(v) => toggleCategory.mutate({ id: c.id, is_active: v })} />
                      <button onClick={() => startEditCategory(c)} className="p-1.5 active:bg-secondary rounded-lg"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deleteCategory.mutate(c.id)} className="p-1.5 active:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  ))}
                  {!categories?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No categories</div>}
                </div>
              </div>
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
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-0.5 block">Category</label>
                    <select value={pCategoryId} onChange={(e) => setPCategoryId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-card text-foreground h-9">
                      <option value="">Select Category</option>
                      {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
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
                  {products?.map((p: any) => (
                    <div key={p.id} className="px-4 py-2.5 flex items-center gap-2">
                      {p.image_url && <img src={p.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{getCategoryName(p.category_id)}</p>
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
              <div className="bg-card rounded-xl border border-border p-3">
                <Input
                  placeholder="Search by email or name..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="h-9 text-[13px]"
                />
              </div>

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

          {/* WEBHOOK SMS */}
          {activeTab === "webhook-sms" && <WebhookSmsTab user={user} />}

          {/* PAYMENT */}
          {activeTab === "payment" && <PaymentTab user={user} />}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-3">
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

// Webhook SMS Tab Component
const WebhookSmsTab = ({ user }: { user: any }) => {
  const queryClient = useQueryClient();
  const [viewMessage, setViewMessage] = useState<any>(null);
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [editSender, setEditSender] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTrxId, setEditTrxId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [addSender, setAddSender] = useState("bKash");
  const [addPhone, setAddPhone] = useState("");
  const [addTrxId, setAddTrxId] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addingMsg, setAddingMsg] = useState(false);
  const [filterSender, setFilterSender] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const { data: webhooks, refetch: refetchWebhooks } = useQuery({
    queryKey: ["admin-sms-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sms_webhooks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: smsMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["admin-sms-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sms_messages").select("*").eq("is_used", false).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const generateToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 24; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  };

  const createWebhook = async () => {
    const token = generateToken();
    const { error } = await supabase.from("sms_webhooks").insert({ token });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetchWebhooks();
    toast({ title: "নতুন Webhook তৈরি হয়েছে!" });
  };

  const deleteWebhook = async (id: string) => {
    const { error } = await supabase.from("sms_webhooks").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetchWebhooks();
  };

  const toggleWebhook = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("sms_webhooks").update({ is_active }).eq("id", id);
    if (error) return;
    refetchWebhooks();
  };

  const regenerateToken = async (id: string) => {
    const token = generateToken();
    const { error } = await supabase.from("sms_webhooks").update({ token }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetchWebhooks();
    toast({ title: "টোকেন রিজেনারেট হয়েছে!" });
  };

  const getWebhookUrl = (token: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `https://${projectId}.supabase.co/functions/v1/store-sms?token=${token}`;
  };

  const copyUrl = (token: string) => {
    navigator.clipboard.writeText(getWebhookUrl(token));
    toast({ title: "URL কপি হয়েছে!" });
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("sms_messages").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetchMessages();
    toast({ title: "মেসেজ ডিলিট হয়েছে!" });
  };

  const deleteAllMessages = async () => {
    const { error } = await supabase.from("sms_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetchMessages();
    toast({ title: "সব মেসেজ ডিলিট হয়েছে!" });
  };

  const startEditMsg = (msg: any) => {
    setEditingMsg(msg);
    setEditSender(msg.sender);
    setEditPhone(msg.phone_number || "");
    setEditTrxId(msg.transaction_id || "");
    setEditAmount(String(msg.amount || 0));
  };

  const saveEditMsg = async () => {
    if (!editingMsg) return;
    const { error } = await supabase.from("sms_messages").update({
      sender: editSender,
      phone_number: editPhone,
      transaction_id: editTrxId,
      amount: parseFloat(editAmount) || 0,
    }).eq("id", editingMsg.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setEditingMsg(null);
    refetchMessages();
    toast({ title: "মেসেজ আপডেট হয়েছে!" });
  };

  return (
    <div className="space-y-3">
      {/* Webhook URLs */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Webhook URLs
          </h3>
          <Button size="sm" onClick={createWebhook}><Plus className="w-3.5 h-3.5 mr-1" /> New Webhook</Button>
        </div>
        <div className="space-y-2">
          {webhooks?.map((wh: any) => (
            <div key={wh.id} className="bg-secondary rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wh.is_active ? "bg-primary" : "bg-destructive"}`} />
                <span className="text-[11px] text-muted-foreground flex-1 font-mono truncate">{getWebhookUrl(wh.token)}</span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => copyUrl(wh.token)} className="h-7 px-2.5 rounded-md text-[10px] font-semibold border border-border text-muted-foreground active:opacity-75 flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={() => regenerateToken(wh.id)} className="h-7 px-2.5 rounded-md text-[10px] font-semibold border border-border text-muted-foreground active:opacity-75 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
                <Switch checked={wh.is_active} onCheckedChange={(v) => toggleWebhook(wh.id, v)} />
                <button onClick={() => deleteWebhook(wh.id)} className="p-1.5 active:bg-destructive/10 rounded-lg ml-auto">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
          {!webhooks?.length && <p className="text-center text-muted-foreground text-[12px] py-4">No webhooks. Click "New Webhook" to create one.</p>}
        </div>
      </div>

      {/* Add Store Message */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4" /> Add Store Message
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select value={addSender} onChange={(e) => setAddSender(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-[12px]">
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="Rocket">Rocket</option>
          </select>
          <Input placeholder="Phone (01XXXXXXXXX)" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} className="h-9 text-[12px]" />
          <Input placeholder="Transaction ID" value={addTrxId} onChange={(e) => setAddTrxId(e.target.value)} className="h-9 text-[12px]" />
          <Input placeholder="Amount (৳)" type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="h-9 text-[12px]" />
        </div>
        <Button size="sm" className="w-full" disabled={addingMsg || !addTrxId || !addAmount}
          onClick={async () => {
            setAddingMsg(true);
            try {
              const webhookId = webhooks?.[0]?.id;
              if (!webhookId) { toast({ title: "Error", description: "প্রথমে একটি Webhook তৈরি করুন", variant: "destructive" }); return; }
              const rawMessage = `${addSender} payment received. Tk ${addAmount} from ${addPhone || "N/A"}. TrxID ${addTrxId}`;
              const { error } = await supabase.from("sms_messages").insert({ webhook_id: webhookId, sender: addSender, phone_number: addPhone, transaction_id: addTrxId, amount: parseFloat(addAmount), raw_message: rawMessage });
              if (error) throw error;
              toast({ title: "Store Message যোগ হয়েছে!" });
              setAddPhone(""); setAddTrxId(""); setAddAmount("");
              refetchMessages();
            } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
            finally { setAddingMsg(false); }
          }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Message
        </Button>
      </div>

      {/* Edit Message Modal */}
      {editingMsg && (
        <div className="bg-card rounded-xl border-2 border-primary p-4 space-y-2">
          <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit Message</h3>
          <div className="grid grid-cols-2 gap-2">
            <select value={editSender} onChange={(e) => setEditSender(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-[12px]">
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
            </select>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className="h-9 text-[12px]" />
            <Input value={editTrxId} onChange={(e) => setEditTrxId(e.target.value)} placeholder="TrxID" className="h-9 text-[12px]" />
            <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} type="number" placeholder="Amount" className="h-9 text-[12px]" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEditMsg}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditingMsg(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* SMS Messages */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-foreground">Store Messages ({smsMessages?.length || 0})</h3>
          <div className="flex gap-1.5">
            <button onClick={() => refetchMessages()} className="p-1.5 active:bg-secondary rounded-lg"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
            {(smsMessages?.length || 0) > 0 && (
              <button onClick={deleteAllMessages} className="h-7 px-2 rounded-md text-[10px] font-semibold border border-destructive/30 text-destructive active:opacity-75 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Delete All
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {smsMessages?.map((msg: any) => (
            <div key={msg.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  msg.sender === "bKash" ? "bg-[#E2136E]/10 text-[#E2136E]" :
                  msg.sender === "Nagad" ? "bg-[#F6921E]/10 text-[#F6921E]" :
                  "bg-muted text-muted-foreground"
                }`}>{msg.sender || "Unknown"}</span>
                {msg.is_used && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">Used</span>}
                <span className="text-[10px] text-muted-foreground ml-auto">{new Date(msg.created_at).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] mb-1">
                <div><span className="text-muted-foreground">Phone: </span><span className="font-semibold text-foreground">{msg.phone_number || "—"}</span></div>
                <div><span className="text-muted-foreground">TrxID: </span><span className="font-semibold text-foreground font-mono">{msg.transaction_id || "—"}</span></div>
                <div><span className="text-muted-foreground">Amount: </span><span className="font-bold text-primary">৳{msg.amount || 0}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMessage(viewMessage?.id === msg.id ? null : msg)} className="text-[10px] text-primary flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {viewMessage?.id === msg.id ? "Hide" : "View"}
                </button>
                <button onClick={() => startEditMsg(msg)} className="text-[10px] text-muted-foreground flex items-center gap-1 active:opacity-75">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => deleteMessage(msg.id)} className="text-[10px] text-destructive flex items-center gap-1 active:opacity-75">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
              {viewMessage?.id === msg.id && (
                <div className="mt-2 bg-secondary rounded-lg p-2 text-[11px] text-foreground whitespace-pre-wrap break-all">{msg.raw_message}</div>
              )}
            </div>
          ))}
          {!smsMessages?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No messages received yet</div>}
        </div>
      </div>
    </div>
  );
};

// Payment Tab Component
const PaymentTab = ({ user }: { user: any }) => {
  const queryClient = useQueryClient();

  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: balanceData, refetch: refetchBalance } = useQuery({
    queryKey: ["admin-balance-tracker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("balance_tracker").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: smsMessages } = useQuery({
    queryKey: ["admin-sms-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sms_messages").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: paymentHistory, refetch: refetchHistory } = useQuery({
    queryKey: ["admin-payment-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_history").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [bkashNum, setBkashNum] = useState("");
  const [nagadNum, setNagadNum] = useState("");

  useEffect(() => {
    if (siteSettings) {
      const bk = siteSettings.find((s: any) => s.key === "bkash_number");
      const ng = siteSettings.find((s: any) => s.key === "nagad_number");
      setBkashNum(bk?.value || "");
      setNagadNum(ng?.value || "");
    }
  }, [siteSettings]);

  const savePaymentNumbers = async () => {
    await supabase.from("site_settings").update({ value: bkashNum }).eq("key", "bkash_number");
    await supabase.from("site_settings").update({ value: nagadNum }).eq("key", "nagad_number");
    queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
    queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    toast({ title: "পেমেন্ট নাম্বার সেভ হয়েছে!" });
  };

  // Pending messages
  const { data: pendingMessages, refetch: refetchPending } = useQuery({
    queryKey: ["admin-pending-sms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sms_messages").select("*").eq("status", "pending").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const bkashTracker = balanceData?.find((b: any) => b.provider === "bKash");
  const nagadTracker = balanceData?.find((b: any) => b.provider === "Nagad");

  const bkashBalance = bkashTracker?.last_balance || 0;
  const nagadBalance = nagadTracker?.last_balance || 0;

  const resetBalance = async (provider: string) => {
    const { error } = await supabase.from("balance_tracker").update({ reset_at: new Date().toISOString(), last_balance: 0, total_received: 0 }).eq("provider", provider);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetchBalance();
    toast({ title: `${provider} ব্যালেন্স রিসেট হয়েছে! এখন থেকে নতুন করে ট্র্যাক হবে।` });
  };

  const approvePending = async (msg: any) => {
    // Approve: update balance_tracker and mark as verified
    const provider = msg.sender;
    if (msg.sms_balance !== null) {
      await supabase.from("balance_tracker").update({ last_balance: msg.sms_balance }).eq("provider", provider);
    }
    await supabase.from("sms_messages").update({ status: "verified" }).eq("id", msg.id);
    refetchPending();
    refetchBalance();
    queryClient.invalidateQueries({ queryKey: ["admin-sms-messages"] });
    toast({ title: "মেসেজ ভেরিফাই হয়েছে এবং ব্যালেন্স আপডেট হয়েছে!" });
  };

  const rejectPending = async (msg: any) => {
    await supabase.from("sms_messages").update({ status: "rejected" }).eq("id", msg.id);
    refetchPending();
    queryClient.invalidateQueries({ queryKey: ["admin-sms-messages"] });
    toast({ title: "মেসেজ রিজেক্ট করা হয়েছে!" });
  };

  return (
    <div className="space-y-3">
      {/* Payment Numbers */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4" /> পেমেন্ট নাম্বার
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-16 text-[11px] font-bold text-[#E2136E]">bKash</div>
            <Input value={bkashNum} onChange={(e) => setBkashNum(e.target.value)} placeholder="01XXXXXXXXX" className="h-9 text-[13px] flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 text-[11px] font-bold text-[#F6921E]">Nagad</div>
            <Input value={nagadNum} onChange={(e) => setNagadNum(e.target.value)} placeholder="01XXXXXXXXX" className="h-9 text-[13px] flex-1" />
          </div>
          <Button size="sm" onClick={savePaymentNumbers} className="w-full"><Save className="w-3.5 h-3.5 mr-1" /> Save Numbers</Button>
        </div>
      </div>

      {/* Balance Tracker */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#E2136E]">bKash Balance</span>
            <button onClick={() => resetBalance("bKash")} className="p-1 active:opacity-75" title="Reset"><RotateCcw className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
          <p className="text-2xl font-black text-foreground">৳{bkashBalance.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground mt-1">Reset: {bkashTracker ? new Date(bkashTracker.reset_at).toLocaleString() : "—"}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#F6921E]">Nagad Balance</span>
            <button onClick={() => resetBalance("Nagad")} className="p-1 active:opacity-75" title="Reset"><RotateCcw className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
          <p className="text-2xl font-black text-foreground">৳{nagadBalance.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground mt-1">Reset: {nagadTracker ? new Date(nagadTracker.reset_at).toLocaleString() : "—"}</p>
        </div>
      </div>

      {/* Pending Messages (Balance Mismatch) */}
      {(pendingMessages?.length || 0) > 0 && (
        <div className="bg-card rounded-xl border-2 border-yellow-500/50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-yellow-500/10">
            <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
              ⚠️ Pending Messages ({pendingMessages?.length || 0})
              <span className="text-[10px] font-normal text-muted-foreground">— ব্যালেন্স মিলেনি</span>
            </h3>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {pendingMessages?.map((msg: any) => (
              <div key={msg.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    msg.sender === "bKash" ? "bg-[#E2136E]/10 text-[#E2136E]" :
                    msg.sender === "Nagad" ? "bg-[#F6921E]/10 text-[#F6921E]" :
                    "bg-muted text-muted-foreground"
                  }`}>{msg.sender}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 font-bold">Pending</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-1.5">
                  <div><span className="text-muted-foreground">Amount: </span><span className="font-bold text-primary">৳{msg.amount || 0}</span></div>
                  <div><span className="text-muted-foreground">SMS Balance: </span><span className="font-bold text-foreground">৳{msg.sms_balance?.toLocaleString() || "—"}</span></div>
                  <div><span className="text-muted-foreground">TrxID: </span><span className="font-semibold font-mono text-foreground">{msg.transaction_id || "—"}</span></div>
                  <div><span className="text-muted-foreground">Phone: </span><span className="font-semibold text-foreground">{msg.phone_number || "—"}</span></div>
                </div>
                <div className="text-[10px] text-muted-foreground bg-secondary rounded p-1.5 mb-2 break-all">{msg.raw_message}</div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-[11px]" onClick={() => approvePending(msg)}>
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-[11px]" onClick={() => rejectPending(msg)}>
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History (Used SMS) */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-foreground">Payment History ({paymentHistory?.length || 0})</h3>
          <div className="flex gap-1.5">
            <button onClick={() => refetchHistory()} className="p-1.5 active:bg-secondary rounded-lg"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
            {(paymentHistory?.length || 0) > 0 && (
              <button onClick={async () => {
                const { error } = await supabase.from("payment_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                refetchHistory();
                toast({ title: "সব Payment History ডিলিট হয়েছে!" });
              }} className="h-7 px-2 rounded-md text-[10px] font-semibold border border-destructive/30 text-destructive active:opacity-75 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Delete All
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
          {paymentHistory?.map((ph: any) => (
            <div key={ph.id} className="px-4 py-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  ph.sender === "bKash" ? "bg-[#E2136E]/10 text-[#E2136E]" :
                  ph.sender === "Nagad" ? "bg-[#F6921E]/10 text-[#F6921E]" :
                  "bg-muted text-muted-foreground"
                }`}>{ph.sender}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{ph.payment_type}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{new Date(ph.created_at).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-muted-foreground">Phone: </span><span className="font-semibold text-foreground">{ph.phone_number || "—"}</span></div>
                <div><span className="text-muted-foreground">TrxID: </span><span className="font-semibold text-foreground font-mono">{ph.transaction_id || "—"}</span></div>
                <div><span className="text-muted-foreground">Amount: </span><span className="font-bold text-primary">৳{ph.amount || 0}</span></div>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <button onClick={async () => {
                  const { error } = await supabase.from("payment_history").delete().eq("id", ph.id);
                  if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                  refetchHistory();
                  toast({ title: "ডিলিট হয়েছে!" });
                }} className="text-[10px] text-destructive flex items-center gap-1 active:opacity-75">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
          {!paymentHistory?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No payment history yet</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
