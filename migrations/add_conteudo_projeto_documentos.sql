ALTER TABLE projeto_documentos ADD COLUMN IF NOT EXISTS conteudo jsonb DEFAULT '[]';
