-- Cria a tabela de feedbacks dos usuários
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS feedbacks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Índice para consultas por usuário
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);

-- RLS: apenas superadmins podem ler feedbacks
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir seu próprio feedback
CREATE POLICY "usuarios podem enviar feedback"
    ON feedbacks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Apenas service role lê os feedbacks (via painel admin Supabase ou script)
-- Se quiser permitir que superadmins leiam, adicione a policy abaixo:
-- CREATE POLICY "superadmins podem ler feedbacks"
--     ON feedbacks
--     FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM users
--             WHERE users.id = auth.uid()
--             AND users.role = 'superadmin'
--         )
--     );
