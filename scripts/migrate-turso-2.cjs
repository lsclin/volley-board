/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@libsql/client");

async function main() {
  const url = process.argv[2] || process.env.DATABASE_URL;
  const authToken = process.argv[3] || process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Usage: node migrate-turso-2.cjs <DATABASE_URL> <AUTH_TOKEN>");
    console.error("Or set DATABASE_URL and TURSO_AUTH_TOKEN env vars");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "Competition" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "season" TEXT,
      "status" TEXT NOT NULL DEFAULT 'upcoming',
      "startDate" DATETIME,
      "endDate" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS "CompetitionFile" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "competitionId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'other',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompetitionFile_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `ALTER TABLE "Match" ADD COLUMN "competitionId" TEXT REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log("OK:", stmt.substring(0, 80).replace(/\n/g, " ") + "...");
    } catch (err) {
      if (err.message && (err.message.includes("already exists") || err.message.includes("duplicate column"))) {
        console.log("SKIP (exists):", stmt.substring(0, 80).replace(/\n/g, " ") + "...");
      } else {
        console.error("FAIL:", err.message);
      }
    }
  }

  // Verify
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("\nTables in Turso:");
  for (const row of tables.rows) {
    console.log("  -", row[0]);
  }

  console.log("\nMigration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
