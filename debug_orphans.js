const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:E%3Dmc2biomuitobom1234@db.xmxwiyudwchrjqfaeplx.supabase.co:5432/postgres"
    });

    try {
        await client.connect();

        console.log("--- Tables with RLS ENABLED ---");
        const resRLS = await client.query(`
            select relname as tablename
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = true;
        `);
        console.table(resRLS.rows);

        console.log("\n--- Tables WITH Policies ---");
        const resPol = await client.query(`
            select distinct tablename from pg_policies where schemaname = 'public';
        `);
        console.table(resPol.rows);

        const rlsTables = resRLS.rows.map(r => r.tablename);
        const polTables = resPol.rows.map(r => r.tablename);
        const orphans = rlsTables.filter(t => !polTables.includes(t));

        console.log("\n--- Orphans (RLS ON, No Policy) ---");
        console.table(orphans);

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await client.end();
    }
}

run();
