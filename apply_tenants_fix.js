const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:E%3Dmc2biomuitobom1234@db.xmxwiyudwchrjqfaeplx.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        const sql = `
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS endereco text;
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS telefone text;
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email text;
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url text;
        `;
        await client.query(sql);
        console.log("Tenants table updated successfully with contact columns!");
    } catch (err) {
        console.error("Error updating tenants table:", err);
    } finally {
        await client.end();
    }
}

run();
