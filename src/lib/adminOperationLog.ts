import { prisma } from "@/lib/db";

type LogClient = Pick<typeof prisma, "adminOperationLog">;

export async function recordAdminOperationLog(
  client: LogClient,
  input: {
    draftId?: string | null;
    operation: string;
    summary: string;
    payload?: unknown;
    status?: "success" | "failed";
    error?: string | null;
  },
) {
  return client.adminOperationLog.create({
    data: {
      draftId: input.draftId ?? null,
      source: "assistant",
      operation: input.operation,
      admin: "admin",
      summary: input.summary,
      payload:
        input.payload === undefined ? null : JSON.stringify(input.payload),
      status: input.status ?? "success",
      error: input.error ?? null,
    },
  });
}
