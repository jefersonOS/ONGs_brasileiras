const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnv() {
    const envPath = path.join(__dirname, '.env.local')
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        envContent.split('\n').forEach(line => {
            const parts = line.split('=')
            if (parts.length >= 2) {
                process.env[parts[0].trim()] = line.substring(line.indexOf('=') + 1).trim()
            }
        })
    }
}

async function check() {
    loadEnv()
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('Verificando colunas da tabela tenants...')
    // Uma forma de listar colunas sem RPC é tentar um select limitado e ver o que volta no erro ou no data
    const { data, error } = await supabase.from('tenants').select('*').limit(1)

    if (error) {
        console.error('Erro ao buscar dados:', error)
    } else if (data && data.length > 0) {
        console.log('Colunas encontradas:', Object.keys(data[0]))
    } else {
        // Se a tabela estiver vazia, pegamos as chaves via query de metadados se houver privilégio
        // mas o Supabase não deixa ver information_schema via standard select.
        console.log('Tabela vazia ou sem retorno.')
    }
}

check()
