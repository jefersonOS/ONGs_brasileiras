-- Tabela de documentos vinculados a projetos
CREATE TABLE IF NOT EXISTS projeto_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  projeto_id uuid REFERENCES projetos(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text,
  categoria text NOT NULL CHECK (categoria IN (
    'projeto_basico',
    'plano_trabalho',
    'relatorio_parcial',
    'relatorio_final',
    'prestacao_contas',
    'ata_reuniao',
    'contrato',
    'outro'
  )),
  arquivo_url text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'rascunho', 'enviado', 'aprovado', 'rejeitado')),
  observacao text,
  conteudo jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projeto_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documentos do tenant" ON projeto_documentos
  FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);
