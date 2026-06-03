const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  const sql = fs.readFileSync(
    path.join(__dirname, "..", "prisma", "migrations", "20260603104515_init", "migration.sql"),
    "utf-8"
  );

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await client.execute(stmt + ";");
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch (err) {
      // Ignore "already exists" errors
      if (err.message && err.message.includes("already exists")) {
        console.log("SKIP (already exists):", stmt.substring(0, 60) + "...");
      } else {
        console.error("FAIL:", err.message);
      }
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});