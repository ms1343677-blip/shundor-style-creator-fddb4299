import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  LayoutDashboard, Package, Layers, LogOut, Plus, Pencil, Trash2, Menu, X,
  ChevronRight, ShoppingCart, Check, XCircle, Settings, Image, Users, Bell, Palette, Save, FolderOpen, MessageSquare, RefreshCw, Copy, Eye, Wallet, RotateCcw, Zap, Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AutoApiTab from "@/components/admin/AutoApiTab";
import AdminOrdersTab from "@/components/admin/AdminOrdersTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";

type Tab = "dashboard" | "categories" | "products" | "packages" | "orders" | "users" | "banners" | "settings" | "webhook-sms" | "payment" | "auto-api";

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
  const [pCustomFields, setPCustomFields] = useState<{key: string; label: string; placeholder: string}[]>([{key: "game_id", label: "এখানে গেমের আইডি দিন", placeholder: "গেম আইডি"}]);

  const [pkgName, setPkgName] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgSortOrder, setPkgSortOrder] = useState(0);
  const [pkgAutoTopup, setPkgAutoTopup] = useState(false);
  const [pkgAutoApiId, setPkgAutoApiId] = useState("");
  const [pkgVariationName, setPkgVariationName] = useState("");
  const [pkgApiTagline, setPkgApiTagline] = useState("");

  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerSortOrder, setBannerSortOrder] = useState(0);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  const [catName, setCatName] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catSortOrder, setCatSortOrder] = useState(0);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    if (isReady && !user) navigate("/login");
  }, [isReady, user, navigate]);

  // ─── Queries ────────────────────
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("sort_order");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: packages } = useQuery({
    queryKey: ["admin-packages", selectedProductId],
    queryFn: async () => {
      let q = supabase.from("packages").select("*, products(name)").order("sort_order");
      if (selectedProductId) q = q.eq("product_id", selectedProductId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: autoApis } = useQuery({
    queryKey: ["admin-auto-apis"],
    queryFn: async () => {
      const { data } = await supabase.from("auto_apis").select("*");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, products(name, image_url), packages(name)")
        .order("created_at", { ascending: false });
      return (data || []).map((o: any) => ({
        ...o,
        product_name: o.products?.name,
        package_name: o.packages?.name,
      }));
    },
    enabled: !!user,
  });

  const { data: banners, refetch: refetchBanners } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data } = await supabase.from("banners").select("*").order("sort_order");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: wallets, refetch: refetchWallets } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("*");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data || [];
    },
    enabled: !!user,
  });

  const catList = categories || [];
  const prodList = products || [];
  const pkgList = packages || [];
  const autoApiList = autoApis || [];
  const orderList = orders || [];
  const bannerList = banners || [];
  const walletList = wallets || [];
  const profileList = profiles || [];

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [addBalanceAmount, setAddBalanceAmount] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // ─── Mutations ─────────────────────────────────────────
  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = { name: catName, image_url: catImageUrl || null, sort_order: catSortOrder };
      if (editingCategory) {
        await supabase.from("categories").update(payload).eq("id", editingCategory.id);
      } else {
        await supabase.from("categories").insert(payload);
      }
    },
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); resetCategoryForm(); toast({ title: "সফল!" }); },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => { await supabase.from("categories").delete().eq("id", id); },
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
  });

  const toggleCategory = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { await supabase.from("categories").update({ is_active }).eq("id", id); },
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
  });

  const resetCategoryForm = () => { setEditingCategory(null); setCatName(""); setCatImageUrl(""); setCatSortOrder(0); };
  const startEditCategory = (c: any) => { setEditingCategory(c); setCatName(c.name); setCatImageUrl(c.image_url || ""); setCatSortOrder(c.sort_order); };

  const saveProduct = useMutation({
    mutationFn: async () => {
      const selectedCat = catList.find((c: any) => c.id === pCategoryId);
      const payload: any = { name: pName, sub_category: pSubCategory, image_url: pImageUrl || null, sort_order: pSortOrder, category_id: pCategoryId || null, custom_fields: JSON.stringify(pCustomFields), category: selectedCat?.name || "Other" };
      if (editingProduct) {
        await supabase.from("products").update(payload).eq("id", editingProduct.id);
      } else {
        await supabase.from("products").insert(payload);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); resetProductForm(); toast({ title: "সফল!" }); },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => { await supabase.from("products").delete().eq("id", id); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const toggleProduct = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { await supabase.from("products").update({ is_active }).eq("id", id); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const savePackage = useMutation({
    mutationFn: async () => {
      if (!selectedProductId && !editingPackage) return;
      const payload: any = { name: pkgName, price: parseFloat(pkgPrice), sort_order: pkgSortOrder, product_id: editingPackage?.product_id || selectedProductId!, auto_topup_enabled: pkgAutoTopup, auto_api_id: pkgAutoApiId || null, product_variation_name: pkgVariationName, api_tagline: pkgApiTagline };
      if (editingPackage) {
        await supabase.from("packages").update(payload).eq("id", editingPackage.id);
      } else {
        await supabase.from("packages").insert(payload);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-packages"] }); resetPackageForm(); toast({ title: "সফল!" }); },
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => { await supabase.from("packages").delete().eq("id", id); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const togglePackage = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { await supabase.from("packages").update({ is_active }).eq("id", id); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, delivery_message }: { id: string; status: string; delivery_message?: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-user", {
        body: { action: "update_order_status", order_id: id, status, delivery_message },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => refetchOrders(),
  });

  const saveBanner = useMutation({
    mutationFn: async () => {
      const payload = { title: bannerTitle, image_url: bannerImageUrl, link_url: bannerLinkUrl, sort_order: bannerSortOrder };
      if (editingBanner) {
        await supabase.from("banners").update(payload).eq("id", editingBanner.id);
      } else {
        await supabase.from("banners").insert(payload);
      }
    },
    onSuccess: () => { refetchBanners(); resetBannerForm(); toast({ title: "সফল!" }); },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => { await supabase.from("banners").delete().eq("id", id); },
    onSuccess: () => refetchBanners(),
  });

  const toggleBanner = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { await supabase.from("banners").update({ is_active }).eq("id", id); },
    onSuccess: () => refetchBanners(),
  });

  const resetProductForm = () => { setEditingProduct(null); setPName(""); setPCategoryId(""); setPSubCategory("Top up"); setPImageUrl(""); setPSortOrder(0); setPCustomFields([{key: "game_id", label: "এখানে গেমের আইডি দিন", placeholder: "গেম আইডি"}]); };
  const resetPackageForm = () => { setEditingPackage(null); setPkgName(""); setPkgPrice(""); setPkgSortOrder(0); setPkgAutoTopup(false); setPkgAutoApiId(""); setPkgVariationName(""); setPkgApiTagline(""); };
  const resetBannerForm = () => { setEditingBanner(null); setBannerTitle(""); setBannerImageUrl(""); setBannerLinkUrl(""); setBannerSortOrder(0); };

  const startEditProduct = (p: any) => { setEditingProduct(p); setPName(p.name); setPCategoryId(p.category_id || ""); setPSubCategory(p.sub_category); setPImageUrl(p.image_url || ""); setPSortOrder(p.sort_order); setPCustomFields(typeof p.custom_fields === 'string' ? JSON.parse(p.custom_fields) : (p.custom_fields || [{key: "game_id", label: "এখানে গেমের আইডি দিন", placeholder: "গেম আইডি"}])); };
  const startEditPackage = (p: any) => { setEditingPackage(p); setPkgName(p.name); setPkgPrice(String(p.price)); setPkgSortOrder(p.sort_order); setPkgAutoTopup(p.auto_topup_enabled || false); setPkgAutoApiId(p.auto_api_id || ""); setPkgVariationName(p.product_variation_name || ""); setPkgApiTagline(p.api_tagline || ""); };
  const startEditBanner = (b: any) => { setEditingBanner(b); setBannerTitle(b.title); setBannerImageUrl(b.image_url); setBannerLinkUrl(b.link_url || ""); setBannerSortOrder(b.sort_order); };

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return null;

  const displayName = user.full_name || user.email?.split("@")[0] || "Admin";
  const pendingOrderCount = orderList.filter((o: any) => o.status === "pending").length;

  const sidebarItems: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "categories", label: "Categories", icon: FolderOpen },
    { id: "products", label: "Products", icon: Package },
    { id: "packages", label: "Packages", icon: Layers },
    { id: "orders", label: "Orders", icon: ShoppingCart, badge: pendingOrderCount },
    { id: "users", label: "Users", icon: Users },
    { id: "banners", label: "Banners", icon: Image },
    { id: "auto-api", label: "Auto API", icon: Zap },
    { id: "webhook-sms", label: "Webhook SMS", icon: MessageSquare },
    { id: "payment", label: "Payment", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "—";
    const cat = catList.find((c: any) => c.id === categoryId);
    return cat?.name || "—";
  };

  return (
    <div className="min-h-screen bg-muted flex">
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

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
              {item.badge ? <span className="ml-auto text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span> : null}
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
                { label: "Categories", value: catList.length, color: "text-accent" },
                { label: "Products", value: prodList.length, color: "text-primary" },
                { label: "Active Products", value: prodList.filter((p: any) => p.is_active).length, color: "text-success" },
                { label: "Packages", value: pkgList.length, color: "text-accent" },
                { label: "Total Orders", value: orderList.length, color: "text-primary" },
                { label: "Pending Orders", value: pendingOrderCount, color: "text-notice-foreground" },
                { label: "Users", value: walletList.length, color: "text-accent" },
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
                  {catList.map((c: any) => (
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
                  {!catList.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No categories</div>}
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
                      {catList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Sub Category</label><Input value={pSubCategory} onChange={(e) => setPSubCategory(e.target.value)} className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Image URL</label><Input value={pImageUrl} onChange={(e) => setPImageUrl(e.target.value)} className="h-9 text-[13px]" /></div>
                  <div><label className="text-[11px] text-muted-foreground mb-0.5 block">Sort Order</label><Input type="number" value={pSortOrder} onChange={(e) => setPSortOrder(Number(e.target.value))} className="h-9 text-[13px]" /></div>
                </div>
                <div className="mt-3 p-3 bg-secondary rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-foreground">User Input Fields</label>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setPCustomFields([...pCustomFields, {key: "", label: "", placeholder: ""}])}>
                      <Plus className="w-3 h-3 mr-1" /> Add Field
                    </Button>
                  </div>
                  {pCustomFields.map((f, i) => (
                    <div key={i} className="grid grid-cols-3 gap-1.5 items-end">
                      <div><label className="text-[10px] text-muted-foreground">Key</label><Input value={f.key} onChange={(e) => { const nf = [...pCustomFields]; nf[i].key = e.target.value; setPCustomFields(nf); }} placeholder="uid" className="h-8 text-[11px]" /></div>
                      <div><label className="text-[10px] text-muted-foreground">Label</label><Input value={f.label} onChange={(e) => { const nf = [...pCustomFields]; nf[i].label = e.target.value; setPCustomFields(nf); }} placeholder="আপনার UID লিখুন" className="h-8 text-[11px]" /></div>
                      <div className="flex gap-1">
                        <Input value={f.placeholder} onChange={(e) => { const nf = [...pCustomFields]; nf[i].placeholder = e.target.value; setPCustomFields(nf); }} placeholder="Placeholder" className="h-8 text-[11px] flex-1" />
                        {pCustomFields.length > 1 && <button onClick={() => setPCustomFields(pCustomFields.filter((_, j) => j !== i))} className="p-1 active:opacity-75"><Trash2 className="w-3 h-3 text-destructive" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => saveProduct.mutate()} disabled={!pName} size="sm">{editingProduct ? "Update" : "Add"}</Button>
                  {editingProduct && <Button variant="outline" size="sm" onClick={resetProductForm}>Cancel</Button>}
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border"><h3 className="text-[13px] font-bold text-foreground">All Products</h3></div>
                <div className="divide-y divide-border">
                  {prodList.map((p: any) => (
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
                  {!prodList.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No products</div>}
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
                  {prodList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                  <div className="mt-3 p-3 bg-secondary rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold text-foreground flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" /> Auto Topup</label>
                      <Switch checked={pkgAutoTopup} onCheckedChange={setPkgAutoTopup} />
                    </div>
                    {pkgAutoTopup && (
                      <>
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-0.5 block">Select Auto API</label>
                          <select value={pkgAutoApiId} onChange={(e) => setPkgAutoApiId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-card text-foreground h-9">
                            <option value="">Select API</option>
                            {autoApiList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-0.5 block">Product Variation Name</label>
                          <Input value={pkgVariationName} onChange={(e) => setPkgVariationName(e.target.value)} placeholder="25 Diamond" className="h-9 text-[13px]" />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-0.5 block">API Tagline</label>
                          <Input value={pkgApiTagline} onChange={(e) => setPkgApiTagline(e.target.value)} placeholder="ff25diamond" className="h-9 text-[13px]" />
                        </div>
                      </>
                    )}
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
                  {pkgList.map((pkg: any) => (
                    <div key={pkg.id} className="px-4 py-2.5 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{pkg.name}</p>
                        <p className="text-[10px] text-muted-foreground">{pkg.products?.name}{pkg.auto_topup_enabled && <span className="ml-1 text-primary">⚡ Auto</span>}</p>
                      </div>
                      <span className="text-[13px] font-bold text-primary">৳{pkg.price}</span>
                      <Switch checked={pkg.is_active} onCheckedChange={(v) => togglePackage.mutate({ id: pkg.id, is_active: v })} />
                      <button onClick={() => startEditPackage(pkg)} className="p-1.5 active:bg-secondary rounded-lg"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deletePackage.mutate(pkg.id)} className="p-1.5 active:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  ))}
                  {!pkgList.length && <div className="p-6 text-center text-muted-foreground text-[12px]">{selectedProductId ? "No packages" : "Select a product"}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === "orders" && <AdminOrdersTab orders={orderList} updateOrderStatus={updateOrderStatus} refetchOrders={refetchOrders} />}

          {/* USERS */}
          {activeTab === "users" && (
            <div className="space-y-3">
              <div className="bg-card rounded-xl border border-border p-3">
                <Input placeholder="Search by email or name..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="h-9 text-[13px]" />
              </div>

              {selectedUser && (() => {
                const profile = profileList.find((p: any) => p.user_id === selectedUser);
                const wallet = walletList.find((w: any) => w.user_id === selectedUser);
                const userOrders = orderList.filter((o: any) => o.user_id === selectedUser);
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
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Add Balance</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Amount" value={addBalanceAmount} onChange={(e) => setAddBalanceAmount(e.target.value)} className="h-9 text-[13px] flex-1" />
                        <Button size="sm" onClick={async () => {
                          const amt = parseFloat(addBalanceAmount);
                          if (!amt || amt <= 0) return;
                          try {
                            const { data: w } = await supabase.from("wallets").select("balance").eq("user_id", selectedUser).maybeSingle();
                            if (w) {
                              await supabase.from("wallets").update({ balance: Number(w.balance) + amt }).eq("user_id", selectedUser);
                            } else {
                              await supabase.from("wallets").insert({ user_id: selectedUser, balance: amt });
                            }
                            toast({ title: `৳${amt} added!` });
                            setAddBalanceAmount("");
                            refetchWallets();
                          } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
                        }}>Add</Button>
                      </div>
                    </div>
                    {userOrders.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Orders ({userOrders.length})</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {userOrders.map((o: any) => (
                            <div key={o.id} className="bg-secondary rounded-lg px-3 py-2 flex items-center justify-between text-[11px]">
                              <span className="text-foreground font-medium truncate">{o.product_name} · ৳{o.amount}</span>
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
                  <h3 className="text-[13px] font-bold text-foreground">All Users ({profileList.length || walletList.length})</h3>
                </div>
                <div className="divide-y divide-border">
                  {profileList
                    .filter((p: any) => {
                      if (!userSearchQuery) return true;
                      const q = userSearchQuery.toLowerCase();
                      return (p.email || "").toLowerCase().includes(q) || (p.full_name || "").toLowerCase().includes(q);
                    })
                    .map((p: any) => {
                      const wallet = walletList.find((w: any) => w.user_id === p.user_id);
                      const isSelected = selectedUser === p.user_id;
                      return (
                        <button key={p.id} onClick={() => setSelectedUser(isSelected ? null : p.user_id)}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 active:bg-secondary ${isSelected ? "bg-primary/5" : ""}`}>
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shrink-0">
                            {(p.full_name || p.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-foreground truncate">{p.full_name || p.email?.split("@")[0] || "User"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                          </div>
                          <span className="text-[11px] font-bold text-primary shrink-0">৳{wallet?.balance || 0}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                        </button>
                      );
                    })}
                  {!profileList.length && !walletList.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No users</div>}
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
                  {bannerList.map((b: any) => (
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
                  {!bannerList.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No banners</div>}
                </div>
              </div>
            </div>
          )}

          {/* AUTO API */}
          {activeTab === "auto-api" && <AutoApiTab user={user} />}

          {/* WEBHOOK SMS */}
          {activeTab === "webhook-sms" && <WebhookSmsTab user={user} />}

          {/* PAYMENT */}
          {activeTab === "payment" && <PaymentTab user={user} />}

          {/* SETTINGS */}
          {activeTab === "settings" && <AdminSettingsTab />}
        </div>
      </main>
    </div>
  );
};

// ─── Webhook SMS Tab ─────────────────────────────────────
const WebhookSmsTab = ({ user }: { user: any }) => {
  const queryClient = useQueryClient();
  const [viewMessage, setViewMessage] = useState<any>(null);
  const [filterSender, setFilterSender] = useState<string>("All");

  const { data: smsMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["admin-sms"],
    queryFn: async () => {
      const { data } = await supabase.from("sms_messages").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const messages = smsMessages || [];

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4" /> SMS Messages
        </h3>
        <p className="text-[11px] text-muted-foreground">SMS webhook থেকে আসা মেসেজগুলো এখানে দেখুন।</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-foreground">Store Messages ({messages.length})</h3>
            <button onClick={() => refetchMessages()} className="p-1.5 active:bg-secondary rounded-lg"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All", "bKash", "Nagad", "Rocket"].map((s) => (
              <button key={s} onClick={() => setFilterSender(s)}
                className={`h-6 px-2.5 rounded-full text-[10px] font-semibold border ${filterSender === s ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {messages.filter((msg: any) => {
            if (filterSender !== "All" && msg.sender !== filterSender) return false;
            return true;
          }).map((msg: any) => (
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
              <button onClick={() => setViewMessage(viewMessage?.id === msg.id ? null : msg)} className="text-[10px] text-primary flex items-center gap-1">
                <Eye className="w-3 h-3" /> {viewMessage?.id === msg.id ? "Hide" : "View"}
              </button>
              {viewMessage?.id === msg.id && (
                <div className="mt-2 bg-secondary rounded-lg p-2 text-[11px] text-foreground whitespace-pre-wrap break-all">{msg.raw_message}</div>
              )}
            </div>
          ))}
          {!messages.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No messages received yet</div>}
        </div>
      </div>
    </div>
  );
};

// ─── Payment Tab ─────────────────────────────────────────
const PaymentTab = ({ user }: { user: any }) => {
  const queryClient = useQueryClient();

  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*");
      return data || [];
    },
    enabled: !!user,
  });

  const settingsList = siteSettings || [];

  const [bkashNum, setBkashNum] = useState("");
  const [nagadNum, setNagadNum] = useState("");

  useEffect(() => {
    if (settingsList.length) {
      const bk = settingsList.find((s: any) => s.key === "bkash_number");
      const ng = settingsList.find((s: any) => s.key === "nagad_number");
      setBkashNum(bk?.value || "");
      setNagadNum(ng?.value || "");
    }
  }, [siteSettings]);

  const savePaymentNumbers = async () => {
    try {
      for (const [key, value] of Object.entries({ bkash_number: bkashNum, nagad_number: nagadNum })) {
        const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
        if (existing) {
          await supabase.from("site_settings").update({ value }).eq("key", key);
        } else {
          await supabase.from("site_settings").insert({ key, value, label: key });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "পেমেন্ট নাম্বার সেভ হয়েছে!" });
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-3">
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
    </div>
  );
};

export default AdminPanel;
