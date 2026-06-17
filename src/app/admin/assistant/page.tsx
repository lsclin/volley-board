"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Clipboard, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AssistantDraft } from "@/lib/assistantSchemas";

const writeActions = [
  "createCompetition",
  "bulkCreateTeams",
  "bulkCreateMatches",
  "updateMatchScore",
];

const examplePrompt = [
  "创建一个赛事，叫2026春季排球联赛，状态设为进行中。",
  "给春季联赛导入队伍：物医、生管火网、工同核人未、地化数微。",
  "周五19点 A队对B队，20点 C队对D队，地点都是气膜馆。",
].join("\n");

function isWriteAction(draft: AssistantDraft | null) {
  return draft ? writeActions.includes(draft.action.type) : false;
}

function getActionLabel(actionType: string) {
  const labels: Record<string, string> = {
    generateWechatNotice: "生成微信群公告",
    queryCompetitionInfo: "查询赛事信息",
    createCompetition: "创建赛事",
    bulkCreateTeams: "批量导入队伍",
    bulkCreateMatches: "批量创建赛程",
    updateMatchScore: "录入比分",
  };
  return labels[actionType] || actionType;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function AdminAssistantPage() {
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<AssistantDraft | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [submittedDraftIds, setSubmittedDraftIds] = useState<string[]>([]);

  const draftIsWriteAction = isWriteAction(draft);
  const draftSubmitted = draft
    ? submittedDraftIds.includes(draft.draftId)
    : false;
  const canCommit = Boolean(
    draft && draftIsWriteAction && draft.canCommit && !draftSubmitted,
  );

  const noticeText = useMemo(() => {
    if (draft?.action.type !== "generateWechatNotice") return "";
    return draft.action.input.noticeText;
  }, [draft]);

  const handleParse = async () => {
    setParsing(true);
    setError("");
    setResult(null);
    setDraft(null);

    try {
      const res = await fetch("/api/admin/assistant/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "助手解析失败");
        return;
      }

      setDraft(data as AssistantDraft);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!draft || !canCommit) return;

    setCommitting(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/assistant/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.blockingReasons?.length
            ? data.blockingReasons.join("；")
            : data?.error || "执行失败",
        );
        return;
      }

      setResult(data);
      setSubmittedDraftIds((prev) => [...prev, draft.draftId]);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setCommitting(false);
    }
  };

  const handleCopyNotice = async () => {
    if (!noticeText) return;
    await navigator.clipboard.writeText(noticeText);
    alert("已复制到剪贴板");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <Bot className="mt-0.5 h-4 w-4 flex-none text-blue-600" />
          <div>
            <h2 className="text-sm font-semibold text-blue-900">
              管理员 Agent 助手
            </h2>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              助手只生成结构化草稿。涉及写入数据库的操作必须先预览，再由管理员确认执行。
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <label
          htmlFor="assistant-message"
          className="text-sm font-semibold text-gray-900"
        >
          输入维护需求
        </label>
        <textarea
          id="assistant-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-40 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例如：创建一个赛事，叫2026春季排球联赛，状态设为进行中。"
        />
        <Button
          onClick={handleParse}
          loading={parsing}
          disabled={!message.trim()}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          解析为操作预览
        </Button>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs font-medium text-gray-500">示例</p>
          <pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-500">
            {examplePrompt}
          </pre>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </section>
      ) : null}

      {draft ? (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400">Draft ID: {draft.draftId}</p>
              <h2 className="mt-1 text-base font-bold text-gray-900">
                {draft.intentLabel || getActionLabel(draft.action.type)}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {getActionLabel(draft.action.type)}
              </p>
            </div>
            {!draftIsWriteAction ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                无需确认
              </span>
            ) : draft.canCommit ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                可确认
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                需处理
              </span>
            )}
          </div>

          {draft.blockingReasons.length > 0 ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <p className="font-medium">暂不能执行</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {draft.blockingReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {draft.warnings.length > 0 ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <p className="font-medium">提示</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {draft.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {noticeText ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">公告文案</h3>
                <Button variant="secondary" size="sm" onClick={handleCopyNotice}>
                  <Clipboard className="mr-1 h-4 w-4" />
                  复制
                </Button>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                {noticeText}
              </pre>
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">结构化预览</h3>
            <pre className="max-h-96 overflow-auto rounded-lg bg-gray-950 p-3 text-xs leading-5 text-gray-100">
              {formatJson({
                action: draft.action,
                preview: draft.preview,
              })}
            </pre>
          </div>

          {draftIsWriteAction ? (
            <Button
              onClick={handleCommit}
              loading={committing}
              disabled={!canCommit}
              className="w-full"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {draftSubmitted ? "该草稿已执行" : "确认执行写入"}
            </Button>
          ) : (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
              该操作不写入数据库，无需确认执行。
            </p>
          )}
        </section>
      ) : null}

      {result ? (
        <section className="space-y-2 rounded-xl border border-green-100 bg-green-50 p-4">
          <h2 className="text-sm font-semibold text-green-900">执行成功</h2>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-green-800">
            {formatJson(result)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
