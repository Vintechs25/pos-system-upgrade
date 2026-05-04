
ALTER TABLE public.hardware_products
  ADD COLUMN IF NOT EXISTS price_wholesale numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_contractor numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS barcode text;

CREATE INDEX IF NOT EXISTS idx_hardware_barcode ON public.hardware_products(business_id, barcode);

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS price_tier text NOT NULL DEFAULT 'retail';

ALTER TABLE public.timber_products
  ADD COLUMN IF NOT EXISTS price_wholesale numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_contractor numeric NOT NULL DEFAULT 0;

-- Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  quote_no text,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open', -- open | converted | expired | cancelled
  valid_until date,
  notes text,
  converted_sale_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid,
  kind text NOT NULL,
  name text NOT NULL,
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  unit_label text,
  total numeric NOT NULL DEFAULT 0,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage quotations"
  ON public.quotations FOR ALL TO public
  USING (public.is_business_member(auth.uid(), business_id))
  WITH CHECK (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Members view quotations"
  ON public.quotations FOR SELECT TO public
  USING (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Members manage quotation items"
  ON public.quotation_items FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_items.quotation_id AND public.is_business_member(auth.uid(), q.business_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_items.quotation_id AND public.is_business_member(auth.uid(), q.business_id)));

CREATE TRIGGER quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Split payments
CREATE TABLE IF NOT EXISTS public.sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  method text NOT NULL, -- cash | card | mpesa | credit | cheque | bank
  amount numeric NOT NULL DEFAULT 0,
  reference text,
  mpesa_transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view sale payments"
  ON public.sale_payments FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_payments.sale_id AND public.is_business_member(auth.uid(), s.business_id)));

CREATE POLICY "Members insert sale payments"
  ON public.sale_payments FOR INSERT TO public
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_payments.sale_id AND public.is_business_member(auth.uid(), s.business_id)));

-- Timber remnants
CREATE TABLE IF NOT EXISTS public.timber_remnants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  parent_product_id uuid,
  species text NOT NULL,
  thickness numeric NOT NULL DEFAULT 0,
  width numeric NOT NULL DEFAULT 0,
  length numeric NOT NULL DEFAULT 0,
  length_unit text NOT NULL DEFAULT 'ft',
  price_per_unit numeric NOT NULL DEFAULT 0,
  source_sale_id uuid,
  is_sold boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timber_remnants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage remnants"
  ON public.timber_remnants FOR ALL TO public
  USING (public.is_business_member(auth.uid(), business_id))
  WITH CHECK (public.is_business_member(auth.uid(), business_id));

CREATE TRIGGER timber_remnants_updated_at BEFORE UPDATE ON public.timber_remnants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
