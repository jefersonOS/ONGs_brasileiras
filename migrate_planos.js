const { Client } = require('pg');

async function migrate() {
    const connectionString = "postgresql://postgres:E%3Dmc2biomuitobom1234@db.xmxwiyudwchrjqfaeplx.supabase.co:5432/postgres";
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('--- Adicionando Colunas de Revisão ---');

        const sql = `
            ALTER TABLE public.planos_trabalho 
            ADD COLUMN IF NOT EXISTS revisado_em TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS revisado_por UUID REFERENCES public.users(id),
            ADD COLUMN IF NOT EXISTS parecer_tecnico TEXT;

            -- Caso já exista a coluna 'parecer', podemos migrar os dados se necessário, 
            -- mas por enquanto vamos apenas garantir as colunas que o código espera.
        `;

        await client.query(sql);
        console.log('Colunas adicionadas com sucesso!');
    } catch (err) {
        console.error('Erro na migração:', err.message);
    } finally {
        await client.end();
    }
}

migrate();
