import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  AssistantActionError,
  commitAssistantDraft,
} from "@/lib/assistantActions";
import { commitAssistantRequestSchema } from "@/lib/assistantSchemas";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const draft = commitAssistantRequestSchema.parse(body);
    const result = await commitAssistantDraft(draft);

    return Response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof AssistantActionError) {
      return Response.json(
        {
          error: error.message,
          blockingReasons: error.blockingReasons,
        },
        { status: error.message.includes("已执行") ? 409 : 400 },
      );
    }
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message || "草稿格式不正确" },
        { status: 400 },
      );
    }

    console.error("Failed to commit assistant draft:", error);
    return Response.json({ error: "助手执行失败" }, { status: 500 });
  }
}
