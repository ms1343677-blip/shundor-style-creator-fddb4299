
-- SMS Webhooks table
CREATE TABLE public.sms_webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sms_webhooks"
  ON public.sms_webhooks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sms_webhooks_updated_at
  BEFORE UPDATE ON public.sms_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SMS Messages table
CREATE TABLE public.sms_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid REFERENCES public.sms_webhooks(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL DEFAULT '',
  phone_number text DEFAULT '',
  transaction_id text DEFAULT '',
  amount numeric DEFAULT 0,
  raw_message text NOT NULL DEFAULT '',
  is_used boolean NOT NULL DEFAULT false,
  used_for_order_id uuid DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sms_messages"
  ON public.sms_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sms_messages_updated_at
  BEFORE UPDATE ON public.sms_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add bkash/nagad number settings
INSERT INTO public.site_settings (key, label, value) VALUES
  ('bkash_number', 'bKash Number', ''),
  ('nagad_number', 'Nagad Number', '')
ON CONFLICT (key) DO NOTHING;
