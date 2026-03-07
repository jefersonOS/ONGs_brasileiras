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

async function promoteUser(email) {
    console.log(`Promoting user: ${email}`);

    // 1. Find user in auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const authUser = users.find(u => u.email === email);
    if (!authUser) {
        console.error(`User with email ${email} not found in Supabase Auth`);
        return;
    }

    console.log(`Found Auth User ID: ${authUser.id}`);

    // 2. Update Auth Metadata
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { user_metadata: { ...authUser.user_metadata, role: 'superadmin' } }
    );
    if (updateAuthError) {
        console.error('Error updating Auth metadata:', updateAuthError);
    } else {
        console.log('Auth metadata updated successfully.');
    }

    // 3. Update public.users table
    const { error: updatePublicError } = await supabase
        .from('users')
        .update({ role: 'superadmin' })
        .eq('id', authUser.id); // Better to use ID

    if (updatePublicError) {
        console.error('Error updating public.users table:', updatePublicError);
    } else {
        console.log('public.users table updated successfully.');
    }

    console.log('\n✅ PROMOÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('O usuário deve sair e entrar novamente (logout/login) para que as permissões sejam atualizadas no navegador dele.');
}

promoteUser('jeferson.nod@gmail.com');
