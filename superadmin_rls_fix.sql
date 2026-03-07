-- Fix RLS for Tenants to allow Super Admin access
DROP POLICY IF EXISTS "Tenants visíveis para seus usuários" ON tenants;
CREATE POLICY "Tenants visíveis para todos os seus usuários ou superadmin" ON tenants
FOR SELECT USING (
  (id = ((auth.jwt() -> 'user_metadata'::text) ->> 'tenant_id')::uuid) OR
  ((auth.jwt() -> 'user_metadata'::text) ->> 'role') = 'superadmin'
);

-- Fix RLS for Users to allow Super Admin access
DROP POLICY IF EXISTS "Usuários veem membros do próprio tenant" ON users;
CREATE POLICY "Usuários veem membros do próprio tenant ou superadmin" ON users
FOR SELECT USING (
  (tenant_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'tenant_id')::uuid) OR
  ((auth.jwt() -> 'user_metadata'::text) ->> 'role') = 'superadmin'
);

-- Ensure projects and work plans also follow this if needed by superadmin
DROP POLICY IF EXISTS "Projetos do tenant" ON projetos;
CREATE POLICY "Projetos do tenant ou superadmin" ON projetos
FOR SELECT USING (
  (tenant_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'tenant_id')::uuid) OR
  ((auth.jwt() -> 'user_metadata'::text) ->> 'role') = 'superadmin'
);

DROP POLICY IF EXISTS "Planos do tenant" ON planos_trabalho;
CREATE POLICY "Planos do tenant ou superadmin" ON planos_trabalho
FOR SELECT USING (
  (tenant_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'tenant_id')::uuid) OR
  ((auth.jwt() -> 'user_metadata'::text) ->> 'role') = 'superadmin'
);
