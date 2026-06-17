import "dotenv/config";
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required before starting the app.");
}

if (databaseUrl.startsWith("libsql://") && !authToken) {
  throw new Error("TURSO_AUTH_TOKEN is required for libsql DATABASE_URL.");
}

if (
  !databaseUrl.startsWith("libsql://") &&
  !databaseUrl.startsWith("file:")
) {
  console.log(
    `Skipping AdminOperationLog ensure for unsupported DATABASE_URL scheme: ${databaseUrl.split(":")[0]}`,
  );
  process.exit(0);
}

const client = createClient({
  url: databaseUrl,
  authToken,
});

try {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "AdminOperationLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "draftId" TEXT,
      "source" TEXT NOT NULL DEFAULT 'assistant',
      "operation" TEXT NOT NULL,
      "admin" TEXT NOT NULL DEFAULT 'admin',
      "summary" TEXT NOT NULL,
      "payload" TEXT,
      "status" TEXT NOT NULL DEFAULT 'success',
      "error" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS "AdminOperationLog_draftId_key"
    ON "AdminOperationLog"("draftId")
  `);

  console.log("AdminOperationLog table is ready.");
} finally {
  client.close();
}
