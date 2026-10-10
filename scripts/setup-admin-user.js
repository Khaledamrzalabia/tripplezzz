const { Pool } = require('pg');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.wwuwpolwcmcztfklqwsw:%40Mm7677943%40@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

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

  const email = 'mohamedhelmy@triplezzz.com';
  const pass = '@migohelmy@ABC123XYZ@';
  const hash = crypto.createHash('sha256').update(pass).digest('hex');

  await pool.query(`
    INSERT INTO public.admin_users (email, password_hash, role)
    VALUES ($1, $2, 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, updated_at = NOW();
  `, [email, hash]);

  const { rows } = await pool.query('SELECT id, email, role, created_at FROM public.admin_users');
  console.log('SUCCESS! Admin users in database:', rows);
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
