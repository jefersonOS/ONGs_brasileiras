-- RLS policies for atividades
-- Allow anyone to read public activities (portal)
CREATE POLICY "Atividades públicas visíveis" ON atividades
  FOR SELECT USING (visibilidade = 'publico');

-- Allow authenticated tenant members to manage their activities
CREATE POLICY "Atividades do tenant" ON atividades
  FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- RLS policies for inscricoes
-- Allow public read (for counting inscriptions on portal)
CREATE POLICY "Inscrições públicas leitura" ON inscricoes
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own inscription
CREATE POLICY "Cidadão se inscreve" ON inscricoes
  FOR INSERT WITH CHECK (cidadao_id = auth.uid());

-- Allow authenticated users to manage their own inscriptions
CREATE POLICY "Cidadão gerencia sua inscrição" ON inscricoes
  FOR ALL USING (cidadao_id = auth.uid());

-- Allow tenant staff to manage all inscriptions
CREATE POLICY "Staff gerencia inscrições do tenant" ON inscricoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM atividades a
      WHERE a.id = inscricoes.entidade_id
        AND a.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    )
  );

-- RLS policies for presencas
CREATE POLICY "Presenças do tenant" ON presencas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inscricoes i
      JOIN atividades a ON a.id = i.entidade_id
      WHERE i.id = presencas.inscricao_id
        AND a.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    )
  );

-- RLS policies for certificados
-- Allow public read by validation code (certificate validation page)
CREATE POLICY "Certificados leitura pública" ON certificados
  FOR SELECT USING (true);

-- Allow tenant staff to manage certificates
CREATE POLICY "Certificados do tenant" ON certificados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inscricoes i
      JOIN atividades a ON a.id = i.entidade_id
      WHERE i.id = certificados.inscricao_id
        AND a.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    )
  );
