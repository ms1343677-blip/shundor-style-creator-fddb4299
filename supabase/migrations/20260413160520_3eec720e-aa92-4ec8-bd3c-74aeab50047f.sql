
-- Create payment_history table for used SMS records
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender TEXT NOT NULL DEFAULT '',
  phone_number TEXT DEFAULT '',
  transaction_id TEXT DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  sms_message_id UUID REFERENCES public.sms_messages(id) ON DELETE SET NULL,
  order_id UUID,
  user_id UUID,
  payment_type TEXT NOT NULL DEFAULT 'payment',
  raw_message TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment_history"
  ON public.payment_history FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create balance_tracker table
CREATE TABLE public.balance_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  total_received NUMERIC NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.balance_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage balance_tracker"
  ON public.balance_tracker FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed initial rows for bKash and Nagad
INSERT INTO public.balance_tracker (provider) VALUES ('bKash'), ('Nagad');

CREATE TRIGGER update_balance_tracker_updated_at
  BEFORE UPDATE ON public.balance_tracker
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
