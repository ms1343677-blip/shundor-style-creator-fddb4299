// API client — replaces Supabase client for MySQL backend

const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

function setToken(token: string) {
  localStorage.setItem("auth_token", token);
}

function clearToken() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

function getStoredUser() {
  try {
    const u = localStorage.getItem("auth_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: any) {
  localStorage.setItem("auth_user", JSON.stringify(user));
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Auth ────────────────────────────────────────────────
export const api = {
  // Install
  checkInstall: () => apiFetch("/install/status"),
  install: (body: any) => apiFetch("/install", { method: "POST", body: JSON.stringify(body) }),
  downloadDb: () => `${API_BASE}/install/download-db`,

  // Auth
  register: async (email: string, password: string) => {
    return apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  login: async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (data.token) {
      setToken(data.token);
      setStoredUser(data.user);
    }
    return data;
  },
  getMe: () => apiFetch("/auth/me"),
  logout: () => { clearToken(); },
  getToken,
  getStoredUser,

  // Public data
  getSettings: () => apiFetch("/settings"),
  getCategories: () => apiFetch("/categories"),
  getProducts: () => apiFetch("/products"),
  getProduct: (id: string) => apiFetch(`/products/${id}`),
  getPackages: (productId?: string) => apiFetch(`/packages${productId ? `?product_id=${productId}` : ""}`),
  getBanners: () => apiFetch("/banners"),
  getLatestOrders: () => apiFetch("/latest-orders"),

  // User data
  getWallet: () => apiFetch("/wallet"),
  getOrders: () => apiFetch("/orders"),
  getOrderCount: () => apiFetch("/orders/count"),
  createOrder: (body: any) => apiFetch("/orders", { method: "POST", body: JSON.stringify(body) }),
  verifyPayment: (body: any) => apiFetch("/verify-payment", { method: "POST", body: JSON.stringify(body) }),

  // Developer
  getDeveloperApp: () => apiFetch("/developer-app"),
  createDeveloperApp: () => apiFetch("/developer-app", { method: "POST", body: JSON.stringify({}) }),

  // Admin
  admin: {
    getCategories: () => apiFetch("/admin/categories"),
    saveCategory: (body: any) => apiFetch("/admin/categories", { method: "POST", body: JSON.stringify(body) }),
    deleteCategory: (id: string) => apiFetch(`/admin/categories/${id}`, { method: "DELETE" }),
    patchCategory: (id: string, body: any) => apiFetch(`/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    getProducts: () => apiFetch("/admin/products"),
    saveProduct: (body: any) => apiFetch("/admin/products", { method: "POST", body: JSON.stringify(body) }),
    deleteProduct: (id: string) => apiFetch(`/admin/products/${id}`, { method: "DELETE" }),
    patchProduct: (id: string, body: any) => apiFetch(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    getPackages: (productId?: string) => apiFetch(`/admin/packages${productId ? `?product_id=${productId}` : ""}`),
    savePackage: (body: any) => apiFetch("/admin/packages", { method: "POST", body: JSON.stringify(body) }),
    deletePackage: (id: string) => apiFetch(`/admin/packages/${id}`, { method: "DELETE" }),
    patchPackage: (id: string, body: any) => apiFetch(`/admin/packages/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    getOrders: () => apiFetch("/admin/orders"),
    patchOrder: (id: string, body: any) => apiFetch(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    getBanners: () => apiFetch("/admin/banners"),
    saveBanner: (body: any) => apiFetch("/admin/banners", { method: "POST", body: JSON.stringify(body) }),
    deleteBanner: (id: string) => apiFetch(`/admin/banners/${id}`, { method: "DELETE" }),
    patchBanner: (id: string, body: any) => apiFetch(`/admin/banners/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    getSettings: () => apiFetch("/admin/settings"),
    saveSettings: (settings: Record<string, string>) => apiFetch("/admin/settings", { method: "POST", body: JSON.stringify({ settings }) }),

    getWallets: () => apiFetch("/admin/wallets"),
    addBalance: (userId: string, amount: number) => apiFetch("/admin/wallets/add-balance", { method: "POST", body: JSON.stringify({ user_id: userId, amount }) }),

    getProfiles: () => apiFetch("/admin/profiles"),

    getAutoApis: () => apiFetch("/admin/auto-apis"),
    saveAutoApi: (body: any) => apiFetch("/admin/auto-apis", { method: "POST", body: JSON.stringify(body) }),
    deleteAutoApi: (id: string) => apiFetch(`/admin/auto-apis/${id}`, { method: "DELETE" }),

    getSms: () => apiFetch("/admin/sms"),

    getConfig: () => apiFetch("/admin/config"),
    saveConfig: (body: any) => apiFetch("/admin/config", { method: "POST", body: JSON.stringify(body) }),
  },
};
