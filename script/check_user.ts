
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function checkUser(email: string) {
    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL found.");
        return;
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query('SELECT id, email, username FROM users WHERE email = $1', [email]);
        if (res.rows.length > 0) {
            console.log("User found in DB:", res.rows[0]);
        } else {
            console.log("User NOT found in public.users table.");
        }
    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

checkUser('clickerscreationsma@gmail.com');
