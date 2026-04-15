
-- Developer apps table for API keys
CREATE TABLE public.developer_apps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  app_name text NOT NULL DEFAULT 'My App',
  api_key text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  callback_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_developer_apps_api_key ON public.developer_apps (api_key);
CREATE INDEX idx_developer_apps_user_id ON public.developer_apps (user_id);

ALTER TABLE public.developer_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own apps" ON public.developer_apps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own apps" ON public.developer_apps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own apps" ON public.developer_apps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own apps" ON public.developer_apps FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage developer_apps" ON public.developer_apps FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- External orders table
CREATE TABLE public.external_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  external_order_id text DEFAULT '',
  product_name text NOT NULL DEFAULT '',
  package_name text NOT NULL DEFAULT '',
  game_id text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  callback_status text NOT NULL DEFAULT 'pending',
  callback_response text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_external_orders_app_id ON public.external_orders (developer_app_id);
CREATE INDEX idx_external_orders_status ON public.external_orders (status);

ALTER TABLE public.external_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view own external orders" ON public.external_orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.developer_apps WHERE id = external_orders.developer_app_id AND user_id = auth.uid()));
CREATE POLICY "Admins can manage external_orders" ON public.external_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER update_developer_apps_updated_at BEFORE UPDATE ON public.developer_apps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_external_orders_updated_at BEFORE UPDATE ON public.external_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
