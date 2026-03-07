const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:E%3Dmc2biomuitobom1234@db.xmxwiyudwchrjqfaeplx.supabase.co:5432/postgres"
    });

    try {
        await client.connect();

        console.log("--- RLS Enabled Tables ---");
        const resRLS = await client.query(`
            select relname as tablename, relrowsecurity as rls_enabled 
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = true;
        `);
        console.table(resRLS.rows);

        console.log("\n--- All Active Policies (Public Schema) ---");
        const resPolicies = await client.query(`
            select tablename, policyname, qual as definition, with_check
            from pg_policies 
            where schemaname = 'public';
        `);
        console.table(resPolicies.rows);

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await client.end();
    }
}

run();
