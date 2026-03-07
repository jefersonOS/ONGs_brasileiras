const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixMultiTenancy() {
    console.log('--- Corrigindo Multi-Tenancy (Separação por Instituição) ---');

    // 1. Limpar tenants e usuários atuais para evitar confusão (opcional, mas seguro nesta fase)
    // await supabase.from('users').delete().neq('email', 'keep');
    // await supabase.from('tenants').delete().neq('nome', 'keep');

    // 2. Criar Tenant para o Jeferson
    console.log('\n1. Criando instituição do Jeferson...');
    const { data: tenantJef, error: errJef } = await supabase
        .from('tenants')
        .insert({
            nome: 'Nexori - Gestão Central',
            cnpj: '11.111.111/0001-11',
            status: 'active',
            plano: 'enterprise'
        })
        .select()
        .single();
    if (errJef) throw errJef;
    console.log(`Instituição Jeferson: ${tenantJef.id}`);

    // 3. Criar Tenant para o Pedro
    console.log('\n2. Criando instituição do Pedro...');
    const { data: tenantPedro, error: errPedro } = await supabase
        .from('tenants')
        .insert({
            nome: 'ONG Pedro - Nova Instituição',
            cnpj: '22.222.222/0001-22',
            status: 'active',
            plano: 'pro'
        })
        .select()
        .single();
    if (errPedro) throw errPedro;
    console.log(`Instituição Pedro: ${tenantPedro.id}`);

    // 4. Sincronizar Usuários
    const usersToSync = [
        { email: 'jeferson.nod@gmail.com', tenant_id: tenantJef.id, role: 'superadmin', nome: 'Jeferson Oliveira' },
        { email: 'pedro@teste.com', tenant_id: tenantPedro.id, role: 'proprietario', nome: 'Pedro Cliente' }
    ];

    console.log('\n3. Vinculando usuários às suas respectivas instituições...');
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

    for (const config of usersToSync) {
        const authUser = authUsers.find(u => u.email === config.email);
        if (!authUser) {
            console.warn(`Usuário ${config.email} não encontrado no Auth.`);
            continue;
        }

        // Atualizar public.users
        const { error: upsertErr } = await supabase
            .from('users')
            .upsert({
                id: authUser.id,
                email: config.email,
                nome: config.nome,
                role: config.role,
                tenant_id: config.tenant_id,
                tipo: 'interno',
                ativo: true
            });

        if (upsertErr) console.error(`Erro public.users (${config.email}):`, upsertErr.message);

        // Atualizar Auth Metadata
        const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(authUser.id, {
            user_metadata: {
                ...authUser.user_metadata,
                tenant_id: config.tenant_id,
                role: config.role,
                nome: config.nome
            }
        });

        if (authUpdateErr) console.error(`Erro Auth metadata (${config.email}):`, authUpdateErr.message);

        console.log(`Sincronizado: ${config.email} -> ${config.role} na instituição ${config.tenant_id}`);
    }

    console.log('\n--- Multi-Tenancy Corrigido! ---');
}

fixMultiTenancy().catch(console.error);
