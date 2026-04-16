import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
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

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isReady && !user) navigate("/login");
  }, [isReady, user, navigate]);

  // ─── Queries (all using api client) ────────────────────
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.admin.getCategories(),
    enabled: !!user,
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.admin.getProducts(),
    enabled: !!user,
  });

  const { data: packages } = useQuery({
    queryKey: ["admin-packages", selectedProductId],
    queryFn: () => api.admin.getPackages(selectedProductId || undefined),
    enabled: !!user,
  });

  const { data: autoApis } = useQuery({
    queryKey: ["admin-auto-apis"],
    queryFn: () => api.admin.getAutoApis(),
    enabled: !!user,
  });

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.admin.getOrders(),
    enabled: !!user,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: () => api.admin.getSettings(),
    enabled: !!user,
  });

  const { data: banners, refetch: refetchBanners } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => api.admin.getBanners(),
    enabled: !!user,
  });

  const { data: wallets, refetch: refetchWallets } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: () => api.admin.getWallets(),
    enabled: !!user,
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: () => api.admin.getProfiles(),
    enabled: !!user,
  });

  // Ensure arrays
  const catList = Array.isArray(categories) ? categories : [];
  const prodList = Array.isArray(products) ? products : [];
  const pkgList = Array.isArray(packages) ? packages : [];
  const autoApiList = Array.isArray(autoApis) ? autoApis : [];
  const orderList = Array.isArray(orders) ? orders : [];
  const settingsList = Array.isArray(siteSettings) ? siteSettings : [];
  const bannerList = Array.isArray(banners) ? banners : [];
  const walletList = Array.isArray(wallets) ? wallets : [];
  const profileList = Array.isArray(profiles) ? profiles : [];

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [addBalanceAmount, setAddBalanceAmount] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  useEffect(() => {
    if (settingsList.length) {
      const map: Record<string, string> = {};
      settingsList.forEach((s: any) => { map[s.key] = s.value; });
      setSettingsForm(map);
    }
  }, [siteSettings]);

  // ─── Mutations ─────────────────────────────────────────
  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = { name: catName, image_url: catImageUrl || null, sort_order: catSortOrder };
      if (editingCategory) {
        await api.admin.patchCategory(editingCategory.id, payload);
      } else {
        await api.admin.saveCategory(payload);
      }
    },
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); resetCategoryForm(); toast({ title: "সফল!" }); },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.admin.deleteCategory(id),
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
  });

  const toggleCategory = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.admin.patchCategory(id, { is_active }),
    onSuccess: () => { refetchCategories(); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
  });

  const resetCategoryForm = () => { setEditingCategory(null); setCatName(""); setCatImageUrl(""); setCatSortOrder(0); };
  const startEditCategory = (c: any) => { setEditingCategory(c); setCatName(c.name); setCatImageUrl(c.image_url || ""); setCatSortOrder(c.sort_order); };

  const saveProduct = useMutation({
    mutationFn: async () => {
      const selectedCat = catList.find((c: any) => c.id === pCategoryId);
      const payload: any = { name: pName, sub_category: pSubCategory, image_url: pImageUrl || null, sort_order: pSortOrder, category_id: pCategoryId || null, custom_fields: JSON.stringify(pCustomFields), category: selectedCat?.name || "Other" };
      if (editingProduct) {
        await api.admin.patchProduct(editingProduct.id, payload);
      } else {
        await api.admin.saveProduct(payload);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); resetProductForm(); toast({ title: "সফল!" }); },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.admin.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const toggleProduct = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.admin.patchProduct(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const savePackage = useMutation({
    mutationFn: async () => {
      if (!selectedProductId && !editingPackage) return;
      const payload: any = { name: pkgName, price: parseFloat(pkgPrice), sort_order: pkgSortOrder, product_id: editingPackage?.product_id || selectedProductId!, auto_topup_enabled: pkgAutoTopup, auto_api_id: pkgAutoApiId || null, product_variation_name: pkgVariationName, api_tagline: pkgApiTagline };
      if (editingPackage) {
        await api.admin.patchPackage(editingPackage.id, payload);
      } else {
        await api.admin.savePackage(payload);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-packages"] }); resetPackageForm(); toast({ title: "সফল!" }); },
  });

  const deletePackage = useMutation({
    mutationFn: (id: string) => api.admin.deletePackage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const togglePackage = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.admin.patchPackage(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, delivery_message }: { id: string; status: string; delivery_message?: string }) => {
      await api.admin.patchOrder(id, { status, delivery_message });
    },
    onSuccess: () => refetchOrders(),
  });

  const saveBanner = useMutation({
    mutationFn: async () => {
      const payload = { title: bannerTitle, image_url: bannerImageUrl, link_url: bannerLinkUrl, sort_order: bannerSortOrder };
      if (editingBanner) {
        await api.admin.patchBanner(editingBanner.id, payload);
      } else {
        await api.admin.saveBanner(payload);
      }
    },
    onSuccess: () => { refetchBanners(); resetBannerForm(); toast({ title: "সফল!" }); },
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => api.admin.deleteBanner(id),
    onSuccess: () => refetchBanners(),
  });

  const toggleBanner = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.admin.patchBanner(id, { is_active }),
    onSuccess: () => refetchBanners(),
  });

  const saveSettings = useMutation({
    mutationFn: () => api.admin.saveSettings(settingsForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "সেটিংস সেভ হয়েছে!" });
    },
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
                        <p className="text-[10px] text-muted-foreground">{pkg.product_name || pkg.products?.name}{pkg.auto_topup_enabled && <span className="ml-1 text-primary">⚡ Auto</span>}</p>
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
                            await api.admin.addBalance(selectedUser, amt);
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

  const { data: smsData, refetch: refetchMessages } = useQuery({
    queryKey: ["admin-sms"],
    queryFn: () => api.admin.getSms(),
    enabled: !!user,
  });

  const smsMessages = Array.isArray(smsData) ? smsData : [];

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4" /> SMS Messages
        </h3>
        <p className="text-[11px] text-muted-foreground">SMS webhook ম্যানেজমেন্ট আপনার হোস্টিং সার্ভারে কাজ করবে।</p>
      </div>

      {/* Edit Message Modal */}
      {editingMsg && (
        <div className="bg-card rounded-xl border-2 border-primary p-4 space-y-2">
          <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit Message</h3>
          <div className="grid grid-cols-2 gap-2">
            <select value={editSender} onChange={(e) => setEditSender(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-[12px]">
              <option value="bKash">bKash</option><option value="Nagad">Nagad</option><option value="Rocket">Rocket</option>
            </select>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className="h-9 text-[12px]" />
            <Input value={editTrxId} onChange={(e) => setEditTrxId(e.target.value)} placeholder="TrxID" className="h-9 text-[12px]" />
            <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} type="number" placeholder="Amount" className="h-9 text-[12px]" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setEditingMsg(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* SMS Messages List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-foreground">Store Messages ({smsMessages.length})</h3>
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
          {smsMessages.filter((msg: any) => {
            if (filterSender !== "All" && msg.sender !== filterSender) return false;
            if (filterStatus !== "All" && msg.status !== filterStatus) return false;
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
          {!smsMessages.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No messages received yet</div>}
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
    queryFn: () => api.admin.getSettings(),
    enabled: !!user,
  });

  const settingsList = Array.isArray(siteSettings) ? siteSettings : [];

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
      await api.admin.saveSettings({ bkash_number: bkashNum, nagad_number: nagadNum });
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
