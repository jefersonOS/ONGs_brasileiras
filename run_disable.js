const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:E%3Dmc2biomuitobom1234@db.xmxwiyudwchrjqfaeplx.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        const sql = fs.readFileSync('disable_rls.sql', 'utf8');
        await client.query(sql);
        console.log("Orphan RLS disabled successfully!");
    } catch (err) {
        console.error("Error disabling RLS:", err);
    } finally {
        await client.end();
    }
}

run();
