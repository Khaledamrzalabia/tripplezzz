const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  host: process.env.PGHOST || "aws-1-eu-central-1.pooler.supabase.com",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "postgres",
  user: process.env.PGUSER || "postgres.wwuwpolwcmcztfklqwsw",
  password: process.env.PGPASSWORD || "@Mm7677943@",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  console.log("Connecting to PostgreSQL pooler...");
  try {
    const res = await pool.query("SELECT NOW() as current_time, current_database() as db;");
    console.log("Connected successfully! Server time:", res.rows[0].current_time, "DB:", res.rows[0].db);

    // Read and run schema.sql
    const schemaPath = path.join(__dirname, "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");
    console.log("Running schema.sql migration & product seed...");
    await pool.query(sql);
    console.log("Migration & seeding completed successfully!");

    // Verify products count
    const productsRes = await pool.query("SELECT COUNT(*) as count FROM products;");
    console.log("Total products in database:", productsRes.rows[0].count);

    const sample = await pool.query("SELECT id, name, category, availability FROM products LIMIT 5;");
    console.log("Products in database:", sample.rows);
  } catch (err) {
    console.error("Database connection/migration error:", err);
  } finally {
    await pool.end();
  }
}

main();
