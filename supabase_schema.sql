-- TENANTS
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  dominio_custom text,
  plano text DEFAULT 'free' CHECK (plano IN ('free','pro','enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
  config_portal jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- USUARIOS (internos e cidadãos juntos, separados pelo campo tipo)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  cpf text,
  whatsapp text,
  role text DEFAULT 'membro' CHECK (role IN ('superadmin','proprietario','gestor','membro','cidadao')),
  tipo text DEFAULT 'interno' CHECK (tipo IN ('interno','cidadao')),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- PROJETOS
CREATE TABLE projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  nome text NOT NULL,
  descricao text,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo','arquivado')),
  created_at timestamptz DEFAULT now()
);

-- PLANOS DE TRABALHO
CREATE TABLE planos_trabalho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  projeto_id uuid REFERENCES projetos(id),
  criador_id uuid REFERENCES users(id),
  titulo text NOT NULL,
  descricao text,
  objetivos text,
  justificativa text,
  metas jsonb DEFAULT '[]',
  cronograma jsonb DEFAULT '[]',
  orcamento_estimado numeric(12,2),
  status text DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviado','aprovado','rejeitado')),
  parecer text,
  data_inicio date,
  data_limite date,
  arquivo_url text,
  gerado_por_ia boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PRESTAÇÕES DE CONTAS
CREATE TABLE prestacoes_contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  plano_id uuid REFERENCES planos_trabalho(id),
  criador_id uuid REFERENCES users(id),
  titulo text NOT NULL,
  periodo_mes integer,
  periodo_ano integer,
  status text DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviado','aprovado','rejeitado')),
  itens jsonb DEFAULT '[]',
  parecer text,
  gerado_por_ia boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CURSOS
CREATE TABLE cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  titulo text NOT NULL,
  descricao text,
  categoria text,
  carga_horaria integer,
  instrutor text,
  modalidade text DEFAULT 'presencial' CHECK (modalidade IN ('presencial','online','hibrido')),
  visibilidade text DEFAULT 'publico' CHECK (visibilidade IN ('publico','interno')),
  presenca_minima integer DEFAULT 75,
  thumbnail_url text,
  conteudo_programatico jsonb DEFAULT '[]',
  status text DEFAULT 'ativo' CHECK (status IN ('rascunho','ativo','encerrado')),
  created_at timestamptz DEFAULT now()
);

-- TURMAS
CREATE TABLE turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id uuid REFERENCES cursos(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  vagas integer DEFAULT 30,
  status text DEFAULT 'aberta' CHECK (status IN ('aberta','em_andamento','encerrada')),
  encontros jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- ATIVIDADES
CREATE TABLE atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  projeto_id uuid REFERENCES projetos(id),
  responsavel_id uuid REFERENCES users(id),
  titulo text NOT NULL,
  descricao text,
  tipo text CHECK (tipo IN ('esportiva','saude','cultural','educacional','assistencia','outro')),
  visibilidade text DEFAULT 'publico' CHECK (visibilidade IN ('publico','interno')),
  vagas integer,
  locais jsonb DEFAULT '[]',
  datas jsonb DEFAULT '[]',
  exige_inscricao boolean DEFAULT true,
  emite_comprovante boolean DEFAULT false,
  presenca_minima integer DEFAULT 75,
  publico_alvo text,
  faixa_etaria text,
  status text DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicada','em_andamento','encerrada','cancelada')),
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- INSCRIÇÕES
CREATE TABLE inscricoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo text CHECK (entidade_tipo IN ('curso','atividade')),
  entidade_id uuid NOT NULL,
  turma_id uuid REFERENCES turmas(id),
  cidadao_id uuid REFERENCES users(id) NOT NULL,
  status text DEFAULT 'confirmada' CHECK (status IN ('pendente','confirmada','cancelada','lista_espera')),
  created_at timestamptz DEFAULT now()
);

-- PRESENÇAS
CREATE TABLE presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id uuid REFERENCES inscricoes(id) NOT NULL,
  encontro_id text NOT NULL,
  presente boolean DEFAULT false,
  registrado_por uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- CERTIFICADOS
CREATE TABLE certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id uuid REFERENCES inscricoes(id) NOT NULL,
  cidadao_id uuid REFERENCES users(id) NOT NULL,
  tipo text CHECK (tipo IN ('certificado','comprovante')),
  codigo_validacao text UNIQUE NOT NULL,
  url_pdf text,
  status text DEFAULT 'valido' CHECK (status IN ('valido','cancelado')),
  emitido_em timestamptz DEFAULT now()
);

-- PATRIMÔNIO — BENS
CREATE TABLE patrimonio_bens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  tombamento text NOT NULL,
  descricao text NOT NULL,
  categoria text CHECK (categoria IN ('movel','imovel','equipamento','veiculo','informatica','outro')),
  subcategoria text,
  marca text,
  modelo text,
  numero_serie text,
  valor_aquisicao numeric(12,2),
  data_aquisicao date,
  fonte_recurso text CHECK (fonte_recurso IN ('proprio','doacao','convenio','emenda','outro')),
  vida_util integer,
  depreciacao_anual numeric(5,2),
  valor_atual numeric(12,2),
  localizacao text,
  responsavel_id uuid REFERENCES users(id),
  projeto_id uuid REFERENCES projetos(id),
  estado_conservacao text CHECK (estado_conservacao IN ('otimo','bom','regular','ruim','inservivel')),
  status text DEFAULT 'ativo' CHECK (status IN ('ativo','manutencao','baixado')),
  qrcode_url text,
  nota_fiscal_url text,
  created_at timestamptz DEFAULT now()
);

-- PATRIMÔNIO — MOVIMENTAÇÕES
CREATE TABLE patrimonio_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id uuid REFERENCES patrimonio_bens(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  tipo text CHECK (tipo IN ('transferencia','emprestimo','manutencao','baixa')),
  de_setor text,
  para_setor text,
  responsavel_id uuid REFERENCES users(id),
  data_movimentacao date DEFAULT CURRENT_DATE,
  previsao_devolucao date,
  motivo text,
  created_at timestamptz DEFAULT now()
);

-- PATRIMÔNIO — MANUTENÇÕES
CREATE TABLE patrimonio_manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id uuid REFERENCES patrimonio_bens(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  tipo text CHECK (tipo IN ('preventiva','corretiva')),
  fornecedor text,
  custo numeric(12,2),
  data_entrada date,
  data_saida date,
  status text DEFAULT 'aguardando' CHECK (status IN ('aguardando','em_andamento','concluida')),
  os_url text,
  created_at timestamptz DEFAULT now()
);

-- IA — CONVERSAS
CREATE TABLE ia_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  titulo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- IA — MENSAGENS
CREATE TABLE ia_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid REFERENCES ia_conversas(id) NOT NULL,
  role text CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  modelo_usado text,
  acoes_executadas jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- IA — AÇÕES PENDENTES (alertas proativos)
CREATE TABLE ia_acoes_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  user_id uuid REFERENCES users(id),
  tipo_acao text NOT NULL,
  titulo text NOT NULL,
  descricao text NOT NULL,
  payload jsonb DEFAULT '{}',
  prioridade text DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')),
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','confirmado','ignorado')),
  created_at timestamptz DEFAULT now()
);

-- WHATSAPP — LOGS
CREATE TABLE whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  destinatario_id uuid REFERENCES users(id),
  tipo_destinatario text CHECK (tipo_destinatario IN ('cidadao','funcionario')),
  gatilho text NOT NULL,
  api_usada text CHECK (api_usada IN ('meta','evolution')),
  numero text,
  template_usado text,
  status text DEFAULT 'enviado' CHECK (status IN ('enviado','entregue','falhou','lido')),
  resposta_api jsonb,
  created_at timestamptz DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  user_id uuid REFERENCES users(id),
  acao text NOT NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  dados_antes jsonb,
  dados_depois jsonb,
  ip text,
  gerado_por_ia boolean DEFAULT false,
  modelo_ia text,
  created_at timestamptz DEFAULT now()
);

-- RLS — Ativar em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestacoes_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrimonio_bens ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrimonio_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrimonio_manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_acoes_pendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS SIMPLES DE EXEMPLO PARA RLS
-- Usamos coalesce com uuid_nil() ou similar para evitar erros se metadata não existir
CREATE POLICY "Usuários veem membros do próprio tenant" ON users
  FOR SELECT USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Tenants visíveis para seus usuários" ON tenants
  FOR SELECT USING (id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Projetos do tenant" ON projetos
  FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Planos do tenant" ON planos_trabalho
  FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);
