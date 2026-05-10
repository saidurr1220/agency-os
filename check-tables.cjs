const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

async function main() {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  try {
    // List all tables
    const result = await pool.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("Tables in database:");
    result.rows.forEach(r => console.log(`  - ${r.table_name}`));

    await pool.end();
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
