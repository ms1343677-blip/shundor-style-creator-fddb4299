ALTER TABLE public.external_orders
ADD COLUMN IF NOT EXISTS internal_order_id uuid;

CREATE INDEX IF NOT EXISTS idx_external_orders_internal_order_id
ON public.external_orders (internal_order_id);