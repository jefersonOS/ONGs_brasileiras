const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...v] = line.split('=');
        if (key && v.length > 0) env[key.trim()] = v.join('=').trim();
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log('--- Iniciando Migração de Convites & Permissões ---');

    const sql = `
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{}'::jsonb;

    CREATE TABLE IF NOT EXISTS public.convites_equipe (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        email TEXT,
        permissoes JSONB DEFAULT '{}'::jsonb,
        status TEXT DEFAULT 'pendente',
        expira_em TIMESTAMPTZ NOT NULL,
        criado_por UUID REFERENCES public.users(id),
        created_at TIMESTAMPTZ DEFAULT now()
    );

    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'convites_equipe' AND policyname = 'Dono pode ver convites do tenant') THEN
            ALTER TABLE public.convites_equipe ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Dono pode ver convites do tenant" ON public.convites_equipe
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.users 
                        WHERE users.id = auth.uid() 
                        AND users.tenant_id = convites_equipe.tenant_id 
                        AND users.role IN ('proprietario', 'superadmin')
                    )
                );
        END IF;
    END $$;
    `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error('Erro ao executar SQL via RPC:', error.message);
            console.log('\n--- SQL PARA EXECUÇÃO MANUAL ---');
            console.log(sql);
            console.log('----------------------------');
        } else {
            console.log('Migração concluída com sucesso!');
        }
    } catch (e) {
        console.error('Exceção na migração:', e.message);
    }
}

migrate();
