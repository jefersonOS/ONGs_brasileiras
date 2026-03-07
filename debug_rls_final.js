const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:E%3Dmc2biomuitobom1234@db.xmxwiyudwchrjqfaeplx.supabase.co:5432/postgres"
    });

    try {
        await client.connect();

        console.log("--- ALL Public Policies ---");
        const resPolicies = await client.query(`
            select tablename, policyname, qual as definition, with_check
            from pg_policies 
            where schemaname = 'public';
        `);
        console.table(resPolicies.rows);

        console.log("\n--- Checking for suspicious subqueries ---");
        const suspicious = resPolicies.rows.filter(p => p.definition?.includes('SELECT') || p.with_check?.includes('SELECT'));
        console.table(suspicious);

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await client.end();
    }
}

run();
