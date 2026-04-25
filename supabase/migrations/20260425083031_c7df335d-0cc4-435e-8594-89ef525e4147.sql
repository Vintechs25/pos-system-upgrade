
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('system_owner', 'business_admin', 'supervisor', 'cashier', 'staff');
CREATE TYPE public.business_status AS ENUM ('active', 'suspended', 'revoked');

-- =========================================
-- UTILITY: updated_at trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + auto-grant system_owner to the first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'system_owner')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  business_id UUID,
  branch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, business_id, branch_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role checks (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_system_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'system_owner');
$$;

CREATE OR REPLACE FUNCTION public.is_business_member(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND business_id = _business_id
  ) OR public.is_system_owner(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_business_admin(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND business_id = _business_id AND role = 'business_admin'
  ) OR public.is_system_owner(_user_id);
$$;

-- =========================================
-- BUSINESSES
-- =========================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status public.business_status NOT NULL DEFAULT 'active',
  license_key TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  license_expires_at TIMESTAMPTZ,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- BRANCHES
-- =========================================
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, code)
);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- BUSINESS_USERS membership
-- =========================================
CREATE TABLE public.business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

-- =========================================
-- CUSTOMERS
-- =========================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  type TEXT NOT NULL DEFAULT 'walk-in',
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  loyalty_discount_pct NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- HARDWARE PRODUCTS
-- =========================================
CREATE TABLE public.hardware_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'piece',
  price NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  stock NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 5,
  supplier TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hardware_products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_hardware_products_updated_at
BEFORE UPDATE ON public.hardware_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- TIMBER PRODUCTS
-- =========================================
CREATE TABLE public.timber_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  grade TEXT,
  thickness NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 0,
  length NUMERIC NOT NULL DEFAULT 0,
  dim_unit TEXT NOT NULL DEFAULT 'in',
  length_unit TEXT NOT NULL DEFAULT 'ft',
  price_per_unit NUMERIC NOT NULL DEFAULT 0,
  price_unit TEXT NOT NULL DEFAULT 'ft',
  pieces NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.timber_products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_timber_products_updated_at
BEFORE UPDATE ON public.timber_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- SALES + SALE ITEMS
-- =========================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  receipt_no TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'paid',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  product_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  unit_label TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- =========================================
-- TRIGGER on auth.users for profile creation
-- =========================================
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- POLICIES: profiles
-- =========================================
CREATE POLICY "View own profile or system owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_system_owner(auth.uid()));

CREATE POLICY "Update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =========================================
-- POLICIES: user_roles
-- =========================================
CREATE POLICY "View own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_system_owner(auth.uid())
         OR (business_id IS NOT NULL AND public.is_business_admin(auth.uid(), business_id)));

CREATE POLICY "System owner manages roles"
  ON public.user_roles FOR ALL
  USING (public.is_system_owner(auth.uid())
         OR (business_id IS NOT NULL AND public.is_business_admin(auth.uid(), business_id)))
  WITH CHECK (public.is_system_owner(auth.uid())
              OR (business_id IS NOT NULL AND public.is_business_admin(auth.uid(), business_id)));

-- =========================================
-- POLICIES: businesses
-- =========================================
CREATE POLICY "Members view their business"
  ON public.businesses FOR SELECT
  USING (public.is_system_owner(auth.uid()) OR public.is_business_member(auth.uid(), id));

CREATE POLICY "System owner manages businesses"
  ON public.businesses FOR ALL
  USING (public.is_system_owner(auth.uid()))
  WITH CHECK (public.is_system_owner(auth.uid()));

CREATE POLICY "Business admins update own business"
  ON public.businesses FOR UPDATE
  USING (public.is_business_admin(auth.uid(), id));

-- =========================================
-- POLICIES: branches
-- =========================================
CREATE POLICY "Members view branches"
  ON public.branches FOR SELECT
  USING (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Admins manage branches"
  ON public.branches FOR ALL
  USING (public.is_business_admin(auth.uid(), business_id))
  WITH CHECK (public.is_business_admin(auth.uid(), business_id));

-- =========================================
-- POLICIES: business_users
-- =========================================
CREATE POLICY "Members view business users"
  ON public.business_users FOR SELECT
  USING (public.is_business_member(auth.uid(), business_id) OR auth.uid() = user_id);

CREATE POLICY "Admins manage business users"
  ON public.business_users FOR ALL
  USING (public.is_business_admin(auth.uid(), business_id))
  WITH CHECK (public.is_business_admin(auth.uid(), business_id));

-- =========================================
-- POLICIES: customers
-- =========================================
CREATE POLICY "Members view customers"
  ON public.customers FOR SELECT
  USING (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Members manage customers"
  ON public.customers FOR ALL
  USING (public.is_business_member(auth.uid(), business_id))
  WITH CHECK (public.is_business_member(auth.uid(), business_id));

-- =========================================
-- POLICIES: hardware_products
-- =========================================
CREATE POLICY "Members view hardware"
  ON public.hardware_products FOR SELECT
  USING (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Members manage hardware"
  ON public.hardware_products FOR ALL
  USING (public.is_business_member(auth.uid(), business_id))
  WITH CHECK (public.is_business_member(auth.uid(), business_id));

-- =========================================
-- POLICIES: timber_products
-- =========================================
CREATE POLICY "Members view timber"
  ON public.timber_products FOR SELECT
  USING (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Members manage timber"
  ON public.timber_products FOR ALL
  USING (public.is_business_member(auth.uid(), business_id))
  WITH CHECK (public.is_business_member(auth.uid(), business_id));

-- =========================================
-- POLICIES: sales + sale_items
-- =========================================
CREATE POLICY "Members view sales"
  ON public.sales FOR SELECT
  USING (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Members create sales"
  ON public.sales FOR INSERT
  WITH CHECK (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Admins update sales"
  ON public.sales FOR UPDATE
  USING (public.is_business_admin(auth.uid(), business_id));

CREATE POLICY "Members view sale items"
  ON public.sale_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.is_business_member(auth.uid(), s.business_id)));

CREATE POLICY "Members insert sale items"
  ON public.sale_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.is_business_member(auth.uid(), s.business_id)));
