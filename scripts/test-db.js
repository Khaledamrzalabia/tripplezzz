const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

if (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGPASSWORD) {
  console.error("Missing env: PGHOST, PGUSER and PGPASSWORD are required.");
  process.exit(1);
}

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "postgres",
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
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
