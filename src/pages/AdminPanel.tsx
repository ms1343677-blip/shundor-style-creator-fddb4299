import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import {
  LayoutDashboard, Package, Layers, LogOut, Plus, Pencil, Trash2, Menu, X, ChevronRight
} from "lucide-react";

type Tab = "dashboard" | "products" | "packages";

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

  useEffect(() => {
    if (isReady && !user) navigate("/login");
  }, [isReady, user, navigate]);

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); resetProductForm(); },
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-packages"] }); resetPackageForm(); },
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("packages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const togglePackage = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("packages").update({ is_active }).eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const resetProductForm = () => { setEditingProduct(null); setPName(""); setPCategory("Game"); setPSubCategory("Top up"); setPImageUrl(""); setPSortOrder(0); };
  const resetPackageForm = () => { setEditingPackage(null); setPkgName(""); setPkgPrice(""); setPkgSortOrder(0); };

  const startEditProduct = (p: any) => { setEditingProduct(p); setPName(p.name); setPCategory(p.category); setPSubCategory(p.sub_category); setPImageUrl(p.image_url || ""); setPSortOrder(p.sort_order); };
  const startEditPackage = (p: any) => { setEditingPackage(p); setPkgName(p.name); setPkgPrice(String(p.price)); setPkgSortOrder(p.sort_order); };

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin";

  const sidebarItems = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "products" as Tab, label: "Products", icon: Package },
    { id: "packages" as Tab, label: "Packages", icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-muted flex">
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-nav text-nav-foreground transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-nav-foreground/10">
          <h1 className="text-xl font-bold"><span className="text-destructive">RG</span> BAZZER</h1>
          <p className="text-xs text-nav-foreground/60 mt-1">Admin Panel</p>
        </div>
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === item.id ? "bg-primary text-primary-foreground" : "text-nav-foreground hover:bg-nav-foreground/10"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-nav-foreground/10">
          <div className="text-xs text-nav-foreground/60 mb-2 truncate">{user.email}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-nav-foreground/80 hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="w-5 h-5 text-foreground" /></button>
          <h2 className="text-lg font-semibold text-foreground capitalize">{activeTab}</h2>
          <span className="ml-auto text-sm text-muted-foreground">Hi, {displayName}</span>
        </header>

        <div className="p-4 max-w-5xl">
          {activeTab === "dashboard" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-3xl font-bold text-primary mt-1">{products?.length || 0}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Total Packages</p>
                  <p className="text-3xl font-bold text-accent mt-1">{packages?.length || 0}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Active Products</p>
                  <p className="text-3xl font-bold text-success mt-1">{products?.filter((p) => p.is_active).length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label><Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Free Fire TopUp (BD)" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label><Input value={pCategory} onChange={(e) => setPCategory(e.target.value)} placeholder="Game" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Sub Category</label><Input value={pSubCategory} onChange={(e) => setPSubCategory(e.target.value)} placeholder="Top up" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Image URL</label><Input value={pImageUrl} onChange={(e) => setPImageUrl(e.target.value)} placeholder="https://..." /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label><Input type="number" value={pSortOrder} onChange={(e) => setPSortOrder(Number(e.target.value))} /></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => saveProduct.mutate()} disabled={!pName} className="bg-primary text-primary-foreground">{editingProduct ? "Update" : "Add Product"}</Button>
                  {editingProduct && <Button variant="outline" onClick={resetProductForm}>Cancel</Button>}
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">All Products</h3></div>
                <div className="divide-y divide-border">
                  {products?.map((p) => (
                    <div key={p.id} className="p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                      {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category} / {p.sub_category}</p>
                      </div>
                      <Switch checked={p.is_active} onCheckedChange={(v) => toggleProduct.mutate({ id: p.id, is_active: v })} />
                      <button onClick={() => startEditProduct(p)} className="p-1.5 hover:bg-secondary rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => { setSelectedProductId(p.id); setActiveTab("packages"); }} className="p-1.5 hover:bg-secondary rounded-lg"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => deleteProduct.mutate(p.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  ))}
                  {!products?.length && <div className="p-8 text-center text-muted-foreground text-sm">No products yet</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === "packages" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Filter by Product</label>
                <select value={selectedProductId || ""} onChange={(e) => setSelectedProductId(e.target.value || null)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground">
                  <option value="">All Products</option>
                  {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {selectedProductId && (
                <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> {editingPackage ? "Edit Package" : "Add New Package"}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label><Input value={pkgName} onChange={(e) => setPkgName(e.target.value)} placeholder="25 Diamond 💎" /></div>
                    <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Price (TK)</label><Input type="number" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} placeholder="22" /></div>
                    <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label><Input type="number" value={pkgSortOrder} onChange={(e) => setPkgSortOrder(Number(e.target.value))} /></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => savePackage.mutate()} disabled={!pkgName || !pkgPrice} className="bg-primary text-primary-foreground">{editingPackage ? "Update" : "Add Package"}</Button>
                    {editingPackage && <Button variant="outline" onClick={resetPackageForm}>Cancel</Button>}
                  </div>
                </div>
              )}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">Packages</h3></div>
                <div className="divide-y divide-border">
                  {packages?.map((pkg: any) => (
                    <div key={pkg.id} className="p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">{pkg.products?.name}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">৳{pkg.price}</span>
                      <Switch checked={pkg.is_active} onCheckedChange={(v) => togglePackage.mutate({ id: pkg.id, is_active: v })} />
                      <button onClick={() => startEditPackage(pkg)} className="p-1.5 hover:bg-secondary rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => deletePackage.mutate(pkg.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  ))}
                  {!packages?.length && <div className="p-8 text-center text-muted-foreground text-sm">{selectedProductId ? "No packages" : "Select a product"}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
