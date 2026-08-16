import { assistantModelDraftSchema, type AssistantModelDraft } from "@/lib/assistantSchemas";

type AssistantContext = {
  now: string;
  competitions: unknown[];
  teams: unknown[];
  matches: unknown[];
  focusCompetition?: unknown | null;
};

type DeepSeekChatResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class LlmClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmClientError";
  }
}

function getDeepSeekConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com")
    .replace(/\/+$/, "");
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";

  if (!apiKey) {
    throw new LlmClientError("DeepSeek API Key 未配置，请先设置 DEEPSEEK_API_KEY");
  }

  return { apiKey, baseUrl, model };
}

function buildSystemPrompt() {
  return `你是排球协会赛事与活动信息中心的管理员维护助手。你必须只输出 json，不要输出 Markdown 或解释文字。

你只能生成一个 AssistantDraft JSON 对象。所有写操作都只是草稿，真实执行前会由管理员确认。

重要规则：
- 你只能使用这些 action type：generateWechatNotice、queryCompetitionInfo、createCompetition、bulkCreateTeams、bulkCreateMatches、updateMatchScore。
- 一次草稿只能包含一个 action。
- 如果用户同时要求导入队伍并创建赛程，请只生成第一步 bulkCreateTeams，并在 warnings 里说明下一步再创建赛程。
- 队伍属于具体赛事；bulkCreateTeams 和 bulkCreateMatches 必须尽量带上 competitionName。赛事不明确时 canCommit=false。
- 当前赛事上下文：如果 context 里有 focusCompetition，那么涉及赛事、队伍、比赛、比分、公告的操作都默认属于这个赛事，使用 focusCompetition.name 作为 competitionName，不要再次询问"哪个赛事"；除非用户明确提到另一个赛事。
- 比赛支持"时间待确认"：用户只说了对阵但没给时间时，bulkCreateMatches 的 startAt 可以留空字符串，并把该场放在最后，不要编造时间。
- bulkCreateMatches 的 startAt 如果填写，必须是完整 ISO 时间，并带 +08:00 或 Z；时间不明确时置为空字符串表示待确认，而不是 canCommit=false。
- updateMatchScore 必须有唯一 matchId；如果无法唯一定位比赛，canCommit=false，并在 preview 中列候选条件。
- 不支持删除、任意 SQL、自动执行。
- system prompt 中明确要求 json，是为了配合 DeepSeek response_format json_object。

AssistantDraft 示例：
{
  "draftId": "server-generated",
  "intentLabel": "创建赛事",
  "action": {
    "type": "createCompetition",
    "input": {
      "name": "2026春季排球联赛",
      "description": null,
      "season": "2026春季",
      "status": "ongoing",
      "startDate": null,
      "endDate": null
    }
  },
  "preview": {
    "操作": "创建赛事",
    "名称": "2026春季排球联赛",
    "状态": "进行中"
  },
  "canCommit": true,
  "blockingReasons": [],
  "warnings": []
}`;
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    throw new LlmClientError(
      "模型返回的 JSON 格式不完整或无法解析，请补充更明确的信息后重试",
    );
  }
}

export async function parseAssistantMessageWithDeepSeek({
  message,
  context,
}: {
  message: string;
  context: AssistantContext;
}): Promise<AssistantModelDraft> {
  const { apiKey, baseUrl, model } = getDeepSeekConfig();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      max_tokens: 3000,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: JSON.stringify({
            request: message,
            context,
            responseRequirement: "Return one valid json AssistantDraft object only.",
          }),
        },
      ],
    }),
  });

  let payload: DeepSeekChatResponse;
  try {
    payload = (await res.json()) as DeepSeekChatResponse;
  } catch {
    throw new LlmClientError("DeepSeek 返回了无法解析的响应，请稍后重试");
  }

  if (!res.ok) {
    throw new LlmClientError(
      payload.error?.message
        ? `DeepSeek 请求失败：${payload.error.message}`
        : "DeepSeek 请求失败，请稍后重试",
    );
  }

  const choice = payload.choices?.[0];
  if (!choice) {
    throw new LlmClientError("DeepSeek 没有返回可用结果，请重试");
  }

  if (choice.finish_reason === "length") {
    throw new LlmClientError("模型输出可能被截断，请缩短输入或拆成更小的任务");
  }

  const content = choice.message?.content?.trim();
  if (!content) {
    throw new LlmClientError("DeepSeek 返回了空内容，请重试");
  }

  const json = parseJsonObject(content);
  const parsed = assistantModelDraftSchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "草稿格式不正确";
    throw new LlmClientError(`模型返回结构不符合助手草稿格式：${message}`);
  }

  return parsed.data;
}
