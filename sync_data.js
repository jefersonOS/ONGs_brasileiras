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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function syncAll() {
    console.log('--- Iniciando Sincronização de Dados ---');

    // 1. Garantir que exista um Tenant (ONG)
    console.log('\n1. Verificando tenants...');
    let { data: tenants, error: tenantError } = await supabase.from('tenants').select('*');
    if (tenantError) throw tenantError;

    let defaultTenant;
    if (tenants.length === 0) {
        console.log('Nenhum tenant encontrado. Criando ONG de Teste...');
        const { data: newTenant, error: createError } = await supabase
            .from('tenants')
            .insert({
                nome: 'ONG Nexori Brasil',
                cnpj: '00.000.000/0001-00',
                status: 'active',
                plano: 'pro'
            })
            .select()
            .single();

        if (createError) throw createError;
        defaultTenant = newTenant;
        console.log(`Tenant criado: ${defaultTenant.nome} (${defaultTenant.id})`);
    } else {
        defaultTenant = tenants[0];
        console.log(`Usando tenant existente: ${defaultTenant.nome}`);
    }

    // 2. Listar todos os usuários do Auth
    console.log('\n2. Listando usuários do Supabase Auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    console.log(`Encontrados ${users.length} usuários no Auth.`);

    // 3. Sincronizar para a tabela public.users
    console.log('\n3. Sincronizando usuários para a tabela public...');
    for (const authUser of users) {
        const metadata = authUser.user_metadata || {};

        // Determinar Role
        let role = metadata.role || 'membro';
        // Garantir que Jeferson seja superadmin se não estiver definido
        if (authUser.email === 'jeferson.nod@gmail.com') role = 'superadmin';

        console.log(`Processando: ${authUser.email} | Role: ${role}`);

        const userData = {
            id: authUser.id,
            email: authUser.email,
            nome: metadata.nome || authUser.email.split('@')[0],
            role: role,
            tipo: metadata.tipo || 'interno',
            tenant_id: metadata.tenant_id || defaultTenant.id,
            ativo: true
        };

        const { error: upsertError } = await supabase
            .from('users')
            .upsert(userData, { onConflict: 'id' });

        if (upsertError) {
            console.error(`Erro ao sincronizar ${authUser.email}:`, upsertError.message);
        } else {
            // Se o usuário não tinha tenant_id ou role no metadata, vamos atualizar o auth.users também
            if (!metadata.tenant_id || metadata.role !== role) {
                console.log(`Atualizando metadados no Auth para ${authUser.email}...`);
                await supabase.auth.admin.updateUserById(authUser.id, {
                    user_metadata: {
                        ...metadata,
                        tenant_id: userData.tenant_id,
                        role: userData.role
                    }
                });
            }
            console.log(`Sincronizado com sucesso: ${authUser.email}`);
        }
    }

    console.log('\n--- Sincronização Concluída com Sucesso! ---');
}

syncAll().catch(err => {
    console.error('\n❌ ERRO NA SINCRONIZAÇÃO:', err);
    process.exit(1);
});
