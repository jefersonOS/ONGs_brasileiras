const { Client } = require('pg');

async function setupStorage() {
    const connectionString = "postgresql://postgres:E%3Dmc2biomuitobom1234@db.xmxwiyudwchrjqfaeplx.supabase.co:5432/postgres";
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('--- Configurando Bucket de Armazenamento ---');

        const sql = `
            -- 1. Criar bucket se não existir
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('planos-trabalho', 'planos-trabalho', false)
            ON CONFLICT (id) DO NOTHING;

            -- 2. Políticas de RLS para o Bucket
            -- Permitir que usuários autenticados façam upload
            DROP POLICY IF EXISTS "Permitir upload para usuários autenticados" ON storage.objects;
            CREATE POLICY "Permitir upload para usuários autenticados" ON storage.objects
                FOR INSERT TO authenticated
                WITH CHECK (bucket_id = 'planos-trabalho');

            -- Permitir que usuários vejam seus próprios arquivos ou do seu tenant (simplificado aqui por tenant_id na metadata futuramente, ou apenas auth por enquanto)
            DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON storage.objects;
            CREATE POLICY "Permitir leitura para usuários autenticados" ON storage.objects
                FOR SELECT TO authenticated
                USING (bucket_id = 'planos-trabalho');
        `;

        await client.query(sql);
        console.log('Bucket configurado com sucesso!');
    } catch (err) {
        console.error('Erro no storage:', err.message);
    } finally {
        await client.end();
    }
}

setupStorage();
