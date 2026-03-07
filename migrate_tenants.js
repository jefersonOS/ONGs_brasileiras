const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Simples parser de .env.local
function loadEnv() {
    const envPath = path.join(__dirname, '.env.local')
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        envContent.split('\n').forEach(line => {
            const parts = line.split('=')
            if (parts.length === 2) {
                process.env[parts[0].trim()] = parts[1].trim()
            }
        })
    }
}

async function migrate() {
    loadEnv()

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('Adicionando colunas à tabela tenants...')

    const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS endereco text;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS telefone text;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email text;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url text;
    `
    })

    if (error) {
        console.log('\nPor favor, execute o seguinte comando no SQL Editor do Supabase (O RPC exec_sql falhou):\n')
        console.log(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS endereco text;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS telefone text;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email text;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url text;
    `)
    } else {
        console.log('Colunas adicionadas com sucesso!')
    }
}

migrate()
