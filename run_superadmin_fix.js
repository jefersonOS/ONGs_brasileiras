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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFix() {
    const sql = fs.readFileSync(path.join(__dirname, 'superadmin_rls_fix.sql'), 'utf8');

    console.log('Applying Super Admin RLS fixes...');

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
            console.log('exec_sql RPC not found. Trying semi-manual way or direct query if possible...');
            console.error('Error: This script requires an exec_sql function in Supabase. Please run the SQL manually in the Dashboard if this fails.');
        } else {
            console.error('Error applying RLS fix:', error);
        }
    } else {
        console.log('Super Admin RLS fixes applied successfully!');
    }
}

runFix();
