import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(fileName: string) {
    console.log(`Running migration: ${fileName}`);
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', fileName);
    const sql = fs.readFileSync(filePath, 'utf8');

    // We utilize the 'pg' library via direct connection or we can try to use a special RPC if available.
    // Since we don't have a direct raw SQL endpoint exposed on Supabase JS client usually...
    // Wait, Supabase JS admin client doesn't expose generic "query" method for raw SQL usually.
    // It's better to use 'pg' node module.
}

// ... actually, let's switch to 'pg' completely for this script
import { Client } from 'pg';

async function runMigrationsPg() {
    // Parse connection string from DATABASE_URL if available, or construct it
    // Usually Supabase provides a postgres connection string in the dashboard.
    // Let's assume DATABASE_URL is in .env 

    // Checking .env content first? I can't see it.
    // But usually it's there.

    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL found. Attempting to use SUPABASE_URL/Key via REST is not sufficient for DDL.");
        console.log("Creating a temporary RPC or hoping the user has a SQL editor is the fallback.");
        // Actually, I can use the rpc call IF I had a 'exec_sql' function, but I don't.
        return;
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const migrations = [
            '009_add_sales_count.sql',
            '010_increment_sales_rpc.sql'
        ];

        for (const mig of migrations) {
            console.log(`Executing ${mig}...`);
            const sql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', mig), 'utf8');
            await client.query(sql);
            console.log(`✓ ${mig} applied.`);
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigrationsPg();
