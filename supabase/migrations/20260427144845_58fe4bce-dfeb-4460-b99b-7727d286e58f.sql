-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  contact_person TEXT,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view suppliers" ON public.suppliers
  FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members manage suppliers" ON public.suppliers
  FOR ALL USING (public.is_business_member(auth.uid(), business_id))
  WITH CHECK (public.is_business_member(auth.uid(), business_id));

CREATE TRIGGER trg_suppliers_updated
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_suppliers_business ON public.suppliers(business_id);

-- Add supplier_id to hardware_products
ALTER TABLE public.hardware_products
  ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

CREATE INDEX idx_hardware_supplier ON public.hardware_products(supplier_id);

-- M-Pesa transactions table
CREATE TABLE public.mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  branch_id UUID,
  sale_id UUID,
  amount NUMERIC NOT NULL,
  phone TEXT NOT NULL,
  account_reference TEXT,
  transaction_desc TEXT,
  merchant_request_id TEXT,
  checkout_request_id TEXT UNIQUE,
  result_code INTEGER,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | success | failed | cancelled
  raw_callback JSONB,
  initiated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view mpesa" ON public.mpesa_transactions
  FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
-- Inserts/updates happen server-side via service role; no client policies needed.

CREATE TRIGGER trg_mpesa_updated
  BEFORE UPDATE ON public.mpesa_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mpesa_business ON public.mpesa_transactions(business_id);
CREATE INDEX idx_mpesa_sale ON public.mpesa_transactions(sale_id);
CREATE INDEX idx_mpesa_checkout ON public.mpesa_transactions(checkout_request_id);

-- Add payment ref + mpesa link to sales
ALTER TABLE public.sales
  ADD COLUMN payment_ref TEXT,
  ADD COLUMN mpesa_transaction_id UUID REFERENCES public.mpesa_transactions(id) ON DELETE SET NULL;

-- Business-level M-Pesa config (sandbox vs live + credentials reference)
CREATE TABLE public.mpesa_config (
  business_id UUID PRIMARY KEY,
  environment TEXT NOT NULL DEFAULT 'sandbox', -- sandbox | production
  shortcode TEXT,
  passkey TEXT,
  consumer_key TEXT,
  consumer_secret TEXT,
  callback_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mpesa_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mpesa config" ON public.mpesa_config
  FOR ALL USING (public.is_business_admin(auth.uid(), business_id))
  WITH CHECK (public.is_business_admin(auth.uid(), business_id));
CREATE POLICY "Members view mpesa config" ON public.mpesa_config
  FOR SELECT USING (public.is_business_member(auth.uid(), business_id));

CREATE TRIGGER trg_mpesa_config_updated
  BEFORE UPDATE ON public.mpesa_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();