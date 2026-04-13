
-- Site settings table for dynamic website configuration
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default settings
INSERT INTO public.site_settings (key, value, label) VALUES
  ('notice_text', '১৮ বছরের নিচে অর্ডার করবেন না। সমস্যায় WhatsApp: 01858039475', 'Notice Text'),
  ('notice_enabled', 'true', 'Notice Enabled'),
  ('whatsapp_number', '01858039475', 'WhatsApp Number'),
  ('telegram_link', '', 'Telegram Link'),
  ('facebook_link', '', 'Facebook Link'),
  ('primary_color', '152 60% 30%', 'Primary Theme Color (HSL)'),
  ('notice_color', '45 100% 52%', 'Notice Bar Color (HSL)'),
  ('nav_color', '220 30% 11%', 'Header/Nav Color (HSL)'),
  ('footer_color', '220 30% 11%', 'Footer Color (HSL)'),
  ('site_name', 'RG BAZZER', 'Site Name'),
  ('support_hours', '9AM - 12PM', 'Support Hours');

-- Banners table for homepage slider
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_url text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all banners" ON public.banners FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
