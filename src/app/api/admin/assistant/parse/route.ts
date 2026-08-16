import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getAssistantContext, prepareAssistantDraft } from "@/lib/assistantActions";
import { parseAssistantRequestSchema } from "@/lib/assistantSchemas";
import {
  LlmClientError,
  parseAssistantMessageWithDeepSeek,
} from "@/lib/llmClient";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const { message, competitionId } = parseAssistantRequestSchema.parse(body);

    const context = await getAssistantContext(competitionId);
    const modelDraft = await parseAssistantMessageWithDeepSeek({
      message,
      context,
    });

    const draft = await prepareAssistantDraft({
      draftId: randomUUID(),
      intentLabel: modelDraft.intentLabel,
      action: modelDraft.action,
      preview: modelDraft.preview,
      canCommit: modelDraft.canCommit,
      blockingReasons: modelDraft.blockingReasons,
      warnings: modelDraft.warnings,
    });

    return Response.json(draft);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof LlmClientError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message || "请求格式不正确" },
        { status: 400 },
      );
    }

    console.error("Failed to parse assistant request:", error);
    return Response.json({ error: "助手解析失败" }, { status: 500 });
  }
}
