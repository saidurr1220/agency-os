const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

async function main() {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Connected to database");

    // List all tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("\nTables:", result.rows.map(r => r.table_name).join(", "));

    // Check user table structure
    const userCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position
    `);
    console.log("\nUser columns:", userCols.rows.map(c => `${c.column_name}(${c.data_type})`).join(", "));

    // Check session table
    const sessCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'session'
      ORDER BY ordinal_position
    `);
    console.log("\nSession columns:", sessCols.rows.map(c => `${c.column_name}(${c.data_type})`).join(", "));

    await prisma.$disconnect();
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
