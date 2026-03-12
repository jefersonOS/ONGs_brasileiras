-- Remove the check constraint on categoria to allow free-text values
ALTER TABLE projeto_documentos DROP CONSTRAINT IF EXISTS projeto_documentos_categoria_check;
