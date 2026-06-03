import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = process.env["DATABASE_URL"] || "";
  const authToken = process.env["TURSO_AUTH_TOKEN"] || "";

  // PostgreSQL (Supabase / Neon / Railway)
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // Turso (cloud SQLite)
  if (url.startsWith("libsql://")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({ url, authToken });
    return new PrismaClient({ adapter });
  }

  // Local SQLite file
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pathModule = require("path");
  const filePath = url.replace("file:", "");
  const absolutePath = pathModule.isAbsolute(filePath)
    ? filePath
    : pathModule.resolve(process.cwd(), filePath);
  const adapter = new PrismaLibSql({ url: `file:${absolutePath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}