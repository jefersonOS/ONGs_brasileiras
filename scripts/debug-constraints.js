const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function debug() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...v] = line.split('=');
        if (key && v.length > 0) env[key.trim()] = v.join('=').trim();
    });

    const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log('--- Debugging Tenants Schema ---');

    // Check constraints
    const sql = `
        SELECT 
            pg_get_constraintdef(c.oid) as definition
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'tenants' AND c.conname = 'tenants_status_check';
    `;

    const { data, error } = await s.rpc('exec_sql', { sql });
    if (error) {
        console.error('Error fetching constraint:', error);
    } else {
        console.log('Constraint Definition:', JSON.stringify(data));
    }

    // Check sample data
    const { data: samples, error: sampleError } = await s.from('tenants').select('status').limit(5);
    if (sampleError) {
        console.error('Error fetching samples:', sampleError);
    } else {
        console.log('Current Statuses in DB:', JSON.stringify(samples));
    }
}

debug();
