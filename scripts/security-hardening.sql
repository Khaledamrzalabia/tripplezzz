-- =========================================================
-- TRIPLE Z — Database Hardening: RLS Policies for Orders & Customers
-- =========================================================

-- 1. Enable RLS on customers and orders tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Drop any overly permissive policies if they exist
DROP POLICY IF EXISTS "Deny public anon direct access to customers" ON customers;
DROP POLICY IF EXISTS "Deny public anon direct access to orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated insert to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete to products" ON products;

-- 3. Strict RLS on Products: Public can only SELECT
CREATE POLICY "Public Read Only Products"
  ON products FOR SELECT
  USING (true);

-- Deny public anon direct mutations to products (only service_role / direct pooler can mutate)
CREATE POLICY "Service Role Only Insert Products"
  ON products FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service Role Only Update Products"
  ON products FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service Role Only Delete Products"
  ON products FOR DELETE
  TO service_role
  USING (true);

-- 4. Strict RLS on Customers: Deny all direct PostgREST anon access
-- Our Next.js backend accesses PostgreSQL via the Direct Pooler (postgres user)
-- which bypasses RLS or has table ownership, while public anon callers through PostgREST are blocked.
CREATE POLICY "Service Role Only Access Customers"
  ON customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Strict RLS on Orders: Deny all direct PostgREST anon access
CREATE POLICY "Service Role Only Access Orders"
  ON orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
