const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:E%3Dmc2biomuitobom1234@db.xmxwiyudwchrjqfaeplx.supabase.co:5432/postgres"
    });

    try {
        await client.connect();

        console.log("--- Active Policies ---");
        const resPolicies = await client.query(`
            select tablename, policyname, qual as definition 
            from pg_policies 
            where schemaname = 'public';
        `);
        console.table(resPolicies.rows);

        console.log("\n--- Checking for potential circular dependencies ---");
        // Check if any policy still references a subquery on 'users'
        const recursiveCheck = resPolicies.rows.filter(r => r.definition.includes('(SELECT') && r.definition.includes('users'));
        if (recursiveCheck.length > 0) {
            console.log("Found potentially recursive policies:");
            console.table(recursiveCheck);
        } else {
            console.log("No explicit subqueries on 'users' found in policy definitions.");
        }

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await client.end();
    }
}

run();
