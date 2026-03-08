-- Adiciona colunas para roteamento por subdomínio e domínio personalizado
-- Execute este script no Supabase SQL Editor

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS dominio_custom text UNIQUE;

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_dominio_custom ON tenants(dominio_custom);
