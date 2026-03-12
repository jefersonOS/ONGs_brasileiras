CREATE TABLE IF NOT EXISTS templates_documento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  nome text NOT NULL,
  descricao text,
  categoria text,
  secoes jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE templates_documento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates documento do tenant" ON templates_documento
  FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);
