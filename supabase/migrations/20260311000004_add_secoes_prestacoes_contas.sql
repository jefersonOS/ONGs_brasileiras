ALTER TABLE prestacoes_contas ADD COLUMN IF NOT EXISTS secoes jsonb DEFAULT '[]';
