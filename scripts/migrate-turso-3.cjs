/* eslint-disable @typescript-eslint/no-require-imports */
// Turso 生产库迁移：Match.startAt 允许为空 + MatchStatus 增加 pending。
// 对应 prisma/migrations/20260816025827_add_match_pending_time。
// 用法：
//   TURSO_AUTH_TOKEN=xxx DATABASE_URL=libsql://xxx node scripts/migrate-turso-3.cjs
// 说明：SQLite 不支持直接删除 NOT NULL，需要重建 Match 表。脚本会先复制数据再删旧表。
const { createClient } = require("@libsql/client");

async function main() {
  const url = process.argv[2] || process.env.DATABASE_URL;
  const authToken = process.argv[3] || process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Usage: node migrate-turso-3.cjs <DATABASE_URL> <AUTH_TOKEN>");
    console.error("Or set DATABASE_URL and TURSO_AUTH_TOKEN env vars");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  // 尝试关闭外键约束（Turso 每次执行可能使用不同连接，失败时继续，仅告警）
  for (const pragma of ["PRAGMA defer_foreign_keys=ON", "PRAGMA foreign_keys=OFF"]) {
    try {
      await client.execute(pragma);
      console.log("OK:", pragma);
    } catch (err) {
      console.log("WARN (continue):", pragma, "-", err.message);
    }
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS "new_Match" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "competitionId" TEXT,
      "startAt" DATETIME,
      "location" TEXT NOT NULL,
      "teamAId" TEXT NOT NULL,
      "teamBId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'scheduled',
      "note" TEXT,
      CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    `INSERT INTO "new_Match" ("competitionId", "id", "location", "note", "startAt", "status", "teamAId", "teamBId")
     SELECT "competitionId", "id", "location", "note", "startAt", "status", "teamAId", "teamBId" FROM "Match"`,

    `DROP TABLE "Match"`,

    `ALTER TABLE "new_Match" RENAME TO "Match"`,

    `CREATE INDEX IF NOT EXISTS "Match_competitionId_idx" ON "Match"("competitionId")`,
    `CREATE INDEX IF NOT EXISTS "Match_startAt_idx" ON "Match"("startAt")`,
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log("OK:", stmt.substring(0, 80).replace(/\n/g, " ") + "...");
    } catch (err) {
      console.error("FAIL:", stmt.substring(0, 80).replace(/\n/g, " ") + "...");
      console.error("      ", err.message);
      console.error("中止执行，请检查数据状态后再重试（重复执行 INSERT 前请确认 new_Match 为空）。");
      process.exit(1);
    }
  }

  // Verify
  const check = await client.execute(`SELECT COUNT(*) AS count FROM "Match"`);
  console.log("\nMatch 表记录数:", check.rows[0]?.count ?? "?");

  console.log("\nMigration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
