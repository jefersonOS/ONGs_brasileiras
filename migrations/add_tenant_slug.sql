-- Adiciona coluna slug à tabela tenants para roteamento por subdomínio
-- Execute este script no Supabase SQL Editor

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Exemplo: defina o slug da sua ONG existente (ajuste o id)
-- UPDATE tenants SET slug = 'nome-da-sua-ong' WHERE id = 'SEU_TENANT_ID';
