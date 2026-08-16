import { z } from "zod";

export const assistantActionTypeSchema = z.enum([
  "generateWechatNotice",
  "queryCompetitionInfo",
  "createCompetition",
  "bulkCreateTeams",
  "bulkCreateMatches",
  "updateMatchScore",
]);

export const competitionStatusSchema = z.enum([
  "upcoming",
  "ongoing",
  "finished",
  "archived",
]);

export const matchSetInputSchema = z.object({
  setNo: z.number().int().min(1),
  scoreA: z.number().int().min(0),
  scoreB: z.number().int().min(0),
});

const nullableTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();

export const generateWechatNoticeActionSchema = z.object({
  type: z.literal("generateWechatNotice"),
  input: z.object({
    title: nullableTrimmedString,
    noticeText: z.string().trim().min(1, "公告内容不能为空"),
  }),
});

export const queryCompetitionInfoActionSchema = z.object({
  type: z.literal("queryCompetitionInfo"),
  input: z.object({
    competitionName: nullableTrimmedString,
    includeTeams: z.boolean().default(true),
    includeMatches: z.boolean().default(true),
  }),
});

export const createCompetitionActionSchema = z.object({
  type: z.literal("createCompetition"),
  input: z.object({
    name: z.string().trim().min(1, "赛事名称不能为空"),
    description: nullableTrimmedString,
    season: nullableTrimmedString,
    status: competitionStatusSchema.default("upcoming"),
    startDate: nullableTrimmedString,
    endDate: nullableTrimmedString,
  }),
});

export const bulkCreateTeamsActionSchema = z.object({
  type: z.literal("bulkCreateTeams"),
  input: z.object({
    competitionName: nullableTrimmedString,
    teamNames: z.array(z.string().trim().min(1)).min(1, "队伍列表不能为空"),
  }),
});

export const bulkCreateMatchesActionSchema = z.object({
  type: z.literal("bulkCreateMatches"),
  input: z.object({
    competitionName: nullableTrimmedString,
    matches: z
      .array(
        z.object({
          startAt: z.string().trim().min(1, "比赛时间不能为空"),
          location: z.string().trim().min(1, "比赛地点不能为空"),
          teamAName: z.string().trim().min(1, "队伍 A 不能为空"),
          teamBName: z.string().trim().min(1, "队伍 B 不能为空"),
          note: nullableTrimmedString,
        }),
      )
      .min(1, "赛程列表不能为空"),
  }),
});

export const updateMatchScoreActionSchema = z.object({
  type: z.literal("updateMatchScore"),
  input: z.object({
    matchId: nullableTrimmedString,
    competitionName: nullableTrimmedString,
    teamAName: nullableTrimmedString,
    teamBName: nullableTrimmedString,
    matchDate: nullableTrimmedString,
    sets: z.array(matchSetInputSchema).min(1, "至少需要一局比分"),
  }),
});

export const assistantActionSchema = z.discriminatedUnion("type", [
  generateWechatNoticeActionSchema,
  queryCompetitionInfoActionSchema,
  createCompetitionActionSchema,
  bulkCreateTeamsActionSchema,
  bulkCreateMatchesActionSchema,
  updateMatchScoreActionSchema,
]);

export const assistantDraftSchema = z.object({
  draftId: z.string().trim().min(1, "draftId 不能为空"),
  intentLabel: z.string().trim().min(1, "操作名称不能为空"),
  action: assistantActionSchema,
  preview: z.record(z.string(), z.unknown()).default({}),
  canCommit: z.boolean(),
  blockingReasons: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

export const assistantModelDraftSchema = assistantDraftSchema
  .omit({ draftId: true })
  .extend({
    draftId: z.string().optional(),
  });

export const parseAssistantRequestSchema = z.object({
  message: z.string().trim().min(1, "请输入要处理的内容").max(6000),
  competitionId: z.string().trim().min(1).optional(),
});

export const commitAssistantRequestSchema = assistantDraftSchema;

export const writeAssistantActionTypes = [
  "createCompetition",
  "bulkCreateTeams",
  "bulkCreateMatches",
  "updateMatchScore",
] as const;

export type AssistantActionType = z.infer<typeof assistantActionTypeSchema>;
export type AssistantAction = z.infer<typeof assistantActionSchema>;
export type AssistantDraft = z.infer<typeof assistantDraftSchema>;
export type AssistantModelDraft = z.infer<typeof assistantModelDraftSchema>;
export type MatchSetInput = z.infer<typeof matchSetInputSchema>;

export function isWriteAssistantAction(action: AssistantAction): boolean {
  return writeAssistantActionTypes.includes(
    action.type as (typeof writeAssistantActionTypes)[number],
  );
}
