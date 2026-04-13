
-- Auto APIs table for external top-up API configurations
CREATE TABLE public.auto_apis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  base_url text NOT NULL,
  api_key text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_apis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auto_apis"
ON public.auto_apis FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add auto topup fields to packages
ALTER TABLE public.packages
  ADD COLUMN auto_topup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN auto_api_id uuid REFERENCES public.auto_apis(id) ON DELETE SET NULL,
  ADD COLUMN product_variation_name text NOT NULL DEFAULT '';

-- Add custom_fields to products for configurable user input fields
ALTER TABLE public.products
  ADD COLUMN custom_fields jsonb NOT NULL DEFAULT '[{"key":"game_id","label":"এখানে গেমের আইডি দিন","placeholder":"গেম আইডি"}]';
