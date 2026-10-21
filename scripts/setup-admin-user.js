// Creates or resets an admin user in public.admin_users.
// Usage (all values come from the environment, nothing is hardcoded):
//   DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/setup-admin-user.js

const { Pool } = require('pg');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL;
const email = (process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME || '').trim().toLowerCase();
const pass = process.env.ADMIN_PASSWORD || '';

if (!connectionString || !email || pass.length < 12) {
  console.error('Missing env: DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars) are required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Same format as hashAdminPassword() in src/lib/adminAuth.server.ts
function hashAdminPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  console.log('Setting up admin_users in Supabase PostgreSQL...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO public.admin_users (email, password_hash, role)
    VALUES ($1, $2, 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, updated_at = NOW();
  `, [email, hashAdminPassword(pass)]);

  const { rows } = await pool.query('SELECT id, email, role, created_at FROM public.admin_users');
  console.log('SUCCESS! Admin users in database:', rows);
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
