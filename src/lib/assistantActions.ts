import { prisma } from "@/lib/db";
import { recordAdminOperationLog } from "@/lib/adminOperationLog";
import {
  type AssistantAction,
  type AssistantDraft,
  type MatchSetInput,
  assistantDraftSchema,
  isWriteAssistantAction,
} from "@/lib/assistantSchemas";

type DbClient = Pick<
  typeof prisma,
  "adminOperationLog" | "competition" | "match" | "matchSet" | "team"
>;

type ValidationResult = {
  blockingReasons: string[];
  warnings: string[];
  preview: Record<string, unknown>;
};

export class AssistantActionError extends Error {
  blockingReasons: string[];

  constructor(message: string, blockingReasons: string[] = [message]) {
    super(message);
    this.name = "AssistantActionError";
    this.blockingReasons = blockingReasons;
  }
}

function normalizeName(value: string | null | undefined) {
  return (value || "").trim().replace(/\s+/g, " ");
}

function nameKey(value: string | null | undefined) {
  return normalizeName(value).toLowerCase();
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hasTimezone(value: string) {
  return /(?:z|[+-]\d{2}:\d{2})$/i.test(value.trim());
}

function summarizeSets(sets: MatchSetInput[]) {
  return sets
    .sort((a, b) => a.setNo - b.setNo)
    .map((set) => `第${set.setNo}局 ${set.scoreA}:${set.scoreB}`)
    .join("，");
}

async function resolveCompetitionByName(
  db: DbClient,
  competitionName?: string | null,
) {
  const name = normalizeName(competitionName);
  if (!name) return { competition: null, blockingReasons: [] as string[] };

  const competitions = await db.competition.findMany({
    where: { name: { contains: name } },
    orderBy: { startDate: "desc" },
  });
  const exact = competitions.filter((competition) => nameKey(competition.name) === nameKey(name));
  const candidates = exact.length > 0 ? exact : competitions;

  if (candidates.length === 0) {
    return {
      competition: null,
      blockingReasons: [`未找到赛事：${name}`],
    };
  }

  if (candidates.length > 1) {
    return {
      competition: null,
      blockingReasons: [`赛事不唯一：${name}，请补充完整赛事名称`],
    };
  }

  return { competition: candidates[0], blockingReasons: [] as string[] };
}

async function resolveTeamByNameInCompetition(
  db: DbClient,
  teamName: string,
  competitionId: string,
) {
  const name = normalizeName(teamName);
  const teams = await db.team.findMany({
    where: {
      competitionId,
      name: { contains: name },
    },
    orderBy: { name: "asc" },
  });
  const exact = teams.filter((team) => nameKey(team.name) === nameKey(name));
  const candidates = exact.length > 0 ? exact : teams;

  if (candidates.length === 0) {
    return { team: null, blockingReasons: [`该赛事下队伍不存在：${name}`] };
  }

  if (candidates.length > 1) {
    return { team: null, blockingReasons: [`该赛事下队伍不唯一：${name}`] };
  }

  return { team: candidates[0], blockingReasons: [] as string[] };
}

async function validateGenerateWechatNotice(action: AssistantAction) {
  if (action.type !== "generateWechatNotice") {
    return { blockingReasons: [], warnings: [], preview: {} };
  }

  return {
    blockingReasons: [],
    warnings: [],
    preview: {
      操作: "生成QQ群公告",
      标题: action.input.title || "群公告",
      公告: action.input.noticeText,
    },
  };
}

async function validateQueryCompetitionInfo(
  db: DbClient,
  action: AssistantAction,
): Promise<ValidationResult> {
  if (action.type !== "queryCompetitionInfo") {
    return { blockingReasons: [], warnings: [], preview: {} };
  }

  const competitionName = normalizeName(action.input.competitionName);
  const competitions = await db.competition.findMany({
    where: competitionName ? { name: { contains: competitionName } } : undefined,
    include: {
      matches: {
        include: {
          teamA: true,
          teamB: true,
          sets: { orderBy: { setNo: "asc" } },
        },
        orderBy: { startAt: "asc" },
      },
      files: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { startDate: "desc" },
    take: 10,
  });

  const teams = action.input.includeTeams
    ? await db.team.findMany({
        where:
          competitions.length === 1
            ? { competitionId: competitions[0].id }
            : undefined,
        include: { competition: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
        take: 80,
      })
    : [];

  return {
    blockingReasons: [],
    warnings: competitions.length === 0 ? ["没有找到匹配赛事"] : [],
    preview: {
      操作: "查询赛事信息",
      赛事: competitions.map((competition) => ({
        id: competition.id,
        name: competition.name,
        status: competition.status,
        season: competition.season,
        matches: action.input.includeMatches
          ? competition.matches.map((match) => ({
              id: match.id,
              time: match.startAt ? match.startAt.toISOString() : null,
              location: match.location,
              teams: `${match.teamA.name} vs ${match.teamB.name}`,
              status: match.status,
              sets: match.sets,
            }))
          : undefined,
      })),
      队伍: teams.map((team) => ({
        id: team.id,
        name: team.name,
        competition: team.competition?.name ?? null,
      })),
    },
  };
}

async function validateCreateCompetition(
  db: DbClient,
  action: AssistantAction,
): Promise<ValidationResult> {
  if (action.type !== "createCompetition") {
    return { blockingReasons: [], warnings: [], preview: {} };
  }

  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  const name = normalizeName(action.input.name);

  const existing = await db.competition.findMany({
    where: { name: { contains: name } },
  });
  if (existing.some((competition) => nameKey(competition.name) === nameKey(name))) {
    blockingReasons.push(`赛事已存在：${name}`);
  }

  for (const [label, value] of [
    ["开始日期", action.input.startDate],
    ["结束日期", action.input.endDate],
  ] as const) {
    if (value && !parseDate(value)) {
      blockingReasons.push(`${label}格式不正确`);
    }
  }

  if (!action.input.startDate) warnings.push("未设置开始日期");

  return {
    blockingReasons,
    warnings,
    preview: {
      操作: "创建赛事",
      名称: name,
      赛季: action.input.season || null,
      状态: action.input.status,
      开始日期: action.input.startDate || null,
      结束日期: action.input.endDate || null,
      简介: action.input.description || null,
    },
  };
}

async function validateBulkCreateTeams(
  db: DbClient,
  action: AssistantAction,
): Promise<ValidationResult> {
  if (action.type !== "bulkCreateTeams") {
    return { blockingReasons: [], warnings: [], preview: {} };
  }

  const names = action.input.teamNames.map(normalizeName).filter(Boolean);
  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  const duplicateInputNames = names.filter(
    (name, index) => names.findIndex((item) => nameKey(item) === nameKey(name)) !== index,
  );
  const { competition, blockingReasons: competitionBlocks } =
    await resolveCompetitionByName(db, action.input.competitionName);
  blockingReasons.push(...competitionBlocks);

  if (names.length === 0) blockingReasons.push("队伍列表为空");
  if (!action.input.competitionName) blockingReasons.push("请先指定要导入队伍的赛事");
  if (duplicateInputNames.length > 0) {
    blockingReasons.push(
      `队伍列表存在重复：${uniqueStrings(duplicateInputNames).join("、")}`,
    );
  }

  const existingTeams = competition
    ? await db.team.findMany({
        where: { competitionId: competition.id },
        orderBy: { name: "asc" },
      })
    : [];
  const existingNameKeys = new Set(existingTeams.map((team) => nameKey(team.name)));
  const existingNames = names.filter((name) => existingNameKeys.has(nameKey(name)));
  const creatableNames = names.filter((name) => !existingNameKeys.has(nameKey(name)));

  if (existingNames.length > 0) {
    warnings.push(`已存在的队伍将跳过：${uniqueStrings(existingNames).join("、")}`);
  }
  if (creatableNames.length === 0) {
    blockingReasons.push("没有可新增的队伍");
  }

  return {
    blockingReasons,
    warnings,
    preview: {
      操作: "批量导入队伍",
      所属赛事: competition?.name ?? action.input.competitionName ?? null,
      将创建: uniqueStrings(creatableNames),
      将跳过: uniqueStrings(existingNames),
    },
  };
}

async function validateBulkCreateMatches(
  db: DbClient,
  action: AssistantAction,
): Promise<ValidationResult> {
  if (action.type !== "bulkCreateMatches") {
    return { blockingReasons: [], warnings: [], preview: {} };
  }

  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  const resolvedMatches = [];
  const { competition, blockingReasons: competitionBlocks } =
    await resolveCompetitionByName(db, action.input.competitionName);
  blockingReasons.push(...competitionBlocks);
  if (!action.input.competitionName) {
    blockingReasons.push("请先指定赛事，再创建赛程");
  }

  for (const [index, match] of action.input.matches.entries()) {
    const startAt = parseDate(match.startAt);
    if (!startAt || !hasTimezone(match.startAt)) {
      blockingReasons.push(
        `第 ${index + 1} 场比赛时间不明确，请使用完整日期时间和时区`,
      );
    }

    const teamAResult = competition
      ? await resolveTeamByNameInCompetition(db, match.teamAName, competition.id)
      : { team: null, blockingReasons: [] as string[] };
    const teamBResult = competition
      ? await resolveTeamByNameInCompetition(db, match.teamBName, competition.id)
      : { team: null, blockingReasons: [] as string[] };
    blockingReasons.push(...teamAResult.blockingReasons, ...teamBResult.blockingReasons);

    const teamA = teamAResult.team;
    const teamB = teamBResult.team;
    if (teamA && teamB && teamA.id === teamB.id) {
      blockingReasons.push(`第 ${index + 1} 场比赛双方不能是同一队`);
    }

    if (startAt && teamA && teamB) {
      const duplicate = await db.match.findFirst({
        where: {
          competitionId: competition?.id ?? null,
          startAt,
          OR: [
            { teamAId: teamA.id, teamBId: teamB.id },
            { teamAId: teamB.id, teamBId: teamA.id },
          ],
        },
      });
      if (duplicate) {
        blockingReasons.push(
          `第 ${index + 1} 场比赛疑似重复：${teamA.name} vs ${teamB.name}`,
        );
      }
    }

    resolvedMatches.push({
      startAt: match.startAt,
      location: match.location,
      teamA: teamA?.name ?? match.teamAName,
      teamB: teamB?.name ?? match.teamBName,
      note: match.note || null,
    });
  }

  return {
    blockingReasons: uniqueStrings(blockingReasons),
    warnings,
    preview: {
      操作: "批量创建赛程",
      所属赛事: competition?.name ?? action.input.competitionName ?? "无",
      比赛: resolvedMatches,
    },
  };
}

async function findCandidateMatches(db: DbClient, action: Extract<AssistantAction, { type: "updateMatchScore" }>) {
  const teamNames = [action.input.teamAName, action.input.teamBName]
    .map(normalizeName)
    .filter(Boolean);
  const matches = await db.match.findMany({
    include: {
      competition: true,
      teamA: true,
      teamB: true,
      sets: { orderBy: { setNo: "asc" } },
    },
    orderBy: { startAt: "desc" },
    take: 30,
  });

  return matches.filter((match) => {
    if (action.input.competitionName) {
      const competitionName = nameKey(match.competition?.name);
      if (!competitionName.includes(nameKey(action.input.competitionName))) return false;
    }
    if (action.input.matchDate) {
      const dateText = match.startAt
        ? match.startAt.toISOString().slice(0, 10)
        : "";
      if (!dateText.includes(action.input.matchDate.slice(0, 10))) return false;
    }
    if (teamNames.length === 2) {
      const names = [nameKey(match.teamA.name), nameKey(match.teamB.name)];
      return teamNames.every((name) => names.some((item) => item.includes(nameKey(name))));
    }
    return true;
  });
}

async function validateUpdateMatchScore(
  db: DbClient,
  action: AssistantAction,
): Promise<ValidationResult> {
  if (action.type !== "updateMatchScore") {
    return { blockingReasons: [], warnings: [], preview: {} };
  }

  const blockingReasons: string[] = [];
  const matchId = normalizeName(action.input.matchId);
  const duplicateSetNos = action.input.sets
    .map((set) => set.setNo)
    .filter((setNo, index, list) => list.indexOf(setNo) !== index);
  if (duplicateSetNos.length > 0) {
    blockingReasons.push(`局分编号重复：${uniqueStrings(duplicateSetNos.map(String)).join("、")}`);
  }

  if (!matchId) {
    const candidates = await findCandidateMatches(db, action);
    blockingReasons.push("无法唯一定位比赛，请补充赛事、日期或选择具体比赛");
    return {
      blockingReasons,
      warnings: [],
      preview: {
        操作: "录入比分",
        候选比赛: candidates.map((match) => ({
          id: match.id,
          赛事: match.competition?.name ?? "无",
          时间: match.startAt ? match.startAt.toISOString() : null,
          地点: match.location,
          对阵: `${match.teamA.name} vs ${match.teamB.name}`,
          状态: match.status,
        })),
        局分: action.input.sets,
      },
    };
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      competition: true,
      teamA: true,
      teamB: true,
      sets: { orderBy: { setNo: "asc" } },
    },
  });

  if (!match) {
    blockingReasons.push("比赛不存在或已被删除");
  }

  return {
    blockingReasons,
    warnings: match?.sets.length ? ["该比赛已有比分，确认后会覆盖原局分"] : [],
    preview: {
      操作: "录入比分",
      比赛: match
        ? {
            id: match.id,
            赛事: match.competition?.name ?? "无",
            时间: match.startAt ? match.startAt.toISOString() : null,
            地点: match.location,
            对阵: `${match.teamA.name} vs ${match.teamB.name}`,
          }
        : { id: matchId },
      局分: action.input.sets,
    },
  };
}

async function validateAction(
  db: DbClient,
  action: AssistantAction,
): Promise<ValidationResult> {
  switch (action.type) {
    case "generateWechatNotice":
      return validateGenerateWechatNotice(action);
    case "queryCompetitionInfo":
      return validateQueryCompetitionInfo(db, action);
    case "createCompetition":
      return validateCreateCompetition(db, action);
    case "bulkCreateTeams":
      return validateBulkCreateTeams(db, action);
    case "bulkCreateMatches":
      return validateBulkCreateMatches(db, action);
    case "updateMatchScore":
      return validateUpdateMatchScore(db, action);
  }
}

export async function prepareAssistantDraft(draft: AssistantDraft) {
  const parsed = assistantDraftSchema.parse(draft);
  const validation = await validateAction(prisma, parsed.action);
  const blockingReasons = uniqueStrings([
    ...parsed.blockingReasons,
    ...validation.blockingReasons,
  ]);
  const warnings = uniqueStrings([...parsed.warnings, ...validation.warnings]);
  const writeAction = isWriteAssistantAction(parsed.action);

  return {
    ...parsed,
    preview: {
      ...parsed.preview,
      ...validation.preview,
    },
    canCommit: writeAction && blockingReasons.length === 0,
    blockingReasons,
    warnings,
  };
}

async function createCompetition(db: DbClient, draft: AssistantDraft) {
  if (draft.action.type !== "createCompetition") {
    throw new AssistantActionError("操作类型不匹配");
  }

  const input = draft.action.input;
  const competition = await db.competition.create({
    data: {
      name: normalizeName(input.name),
      description: input.description ?? null,
      season: input.season ?? null,
      status: input.status,
      startDate: parseDate(input.startDate),
      endDate: parseDate(input.endDate),
    },
  });

  const summary = `创建赛事：${competition.name}`;
  await recordAdminOperationLog(db, {
    draftId: draft.draftId,
    operation: draft.action.type,
    summary,
    payload: { action: draft.action, createdId: competition.id },
  });

  return {
    summary,
    records: { competition },
  };
}

async function bulkCreateTeams(db: DbClient, draft: AssistantDraft) {
  if (draft.action.type !== "bulkCreateTeams") {
    throw new AssistantActionError("操作类型不匹配");
  }

  const { competition } = await resolveCompetitionByName(
    db,
    draft.action.input.competitionName,
  );
  if (!competition) {
    throw new AssistantActionError("提交前未能定位赛事，请重新解析");
  }

  const existingTeams = await db.team.findMany({
    where: { competitionId: competition.id },
    orderBy: { name: "asc" },
  });
  const existingNameKeys = new Set(existingTeams.map((team) => nameKey(team.name)));
  const names = uniqueStrings(draft.action.input.teamNames.map(normalizeName).filter(Boolean))
    .filter((name) => !existingNameKeys.has(nameKey(name)));

  const created = [];
  for (const name of names) {
    created.push(
      await db.team.create({
        data: {
          competitionId: competition.id,
          name,
        },
      }),
    );
  }

  const summary = `批量导入队伍：${competition.name} 新增 ${created.length} 个`;
  await recordAdminOperationLog(db, {
    draftId: draft.draftId,
    operation: draft.action.type,
    summary,
    payload: { action: draft.action, createdIds: created.map((team) => team.id) },
  });

  return {
    summary,
    records: { teams: created },
  };
}

async function bulkCreateMatches(db: DbClient, draft: AssistantDraft) {
  if (draft.action.type !== "bulkCreateMatches") {
    throw new AssistantActionError("操作类型不匹配");
  }

  const { competition } = await resolveCompetitionByName(
    db,
    draft.action.input.competitionName,
  );
  if (!competition) {
    throw new AssistantActionError("提交前未能定位赛事，请重新解析");
  }
  const created = [];

  for (const match of draft.action.input.matches) {
    const teamA = (
      await resolveTeamByNameInCompetition(db, match.teamAName, competition.id)
    ).team;
    const teamB = (
      await resolveTeamByNameInCompetition(db, match.teamBName, competition.id)
    ).team;
    const startAt = parseDate(match.startAt);

    if (!teamA || !teamB || !startAt) {
      throw new AssistantActionError("赛程校验失败，请重新解析后再确认");
    }

    created.push(
      await db.match.create({
        data: {
          competitionId: competition.id,
          startAt,
          location: match.location,
          teamAId: teamA.id,
          teamBId: teamB.id,
          status: "scheduled",
          note: match.note ?? null,
        },
        include: {
          teamA: true,
          teamB: true,
          competition: true,
        },
      }),
    );
  }

  const summary = `批量创建赛程：新增 ${created.length} 场`;
  await recordAdminOperationLog(db, {
    draftId: draft.draftId,
    operation: draft.action.type,
    summary,
    payload: { action: draft.action, createdIds: created.map((match) => match.id) },
  });

  return {
    summary,
    records: { matches: created },
  };
}

async function updateMatchScore(db: DbClient, draft: AssistantDraft) {
  if (draft.action.type !== "updateMatchScore") {
    throw new AssistantActionError("操作类型不匹配");
  }

  const matchId = normalizeName(draft.action.input.matchId);
  const match = await db.match.update({
    where: { id: matchId },
    data: { status: "finished" },
    include: {
      teamA: true,
      teamB: true,
      competition: true,
    },
  });

  await db.matchSet.deleteMany({ where: { matchId } });
  for (const set of draft.action.input.sets.sort((a, b) => a.setNo - b.setNo)) {
    await db.matchSet.create({
      data: {
        matchId,
        setNo: set.setNo,
        scoreA: set.scoreA,
        scoreB: set.scoreB,
      },
    });
  }

  const updated = await db.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: true,
      teamB: true,
      competition: true,
      sets: { orderBy: { setNo: "asc" } },
    },
  });

  const summary = `录入比分：${match.teamA.name} vs ${match.teamB.name}，${summarizeSets(draft.action.input.sets)}`;
  await recordAdminOperationLog(db, {
    draftId: draft.draftId,
    operation: draft.action.type,
    summary,
    payload: { action: draft.action, matchId },
  });

  return {
    summary,
    records: { match: updated },
  };
}

export async function commitAssistantDraft(draft: AssistantDraft) {
  const parsed = assistantDraftSchema.parse(draft);

  if (!isWriteAssistantAction(parsed.action)) {
    throw new AssistantActionError("该操作不需要确认执行");
  }
  if (!parsed.canCommit) {
    throw new AssistantActionError(
      parsed.blockingReasons[0] || "该草稿当前不可执行",
      parsed.blockingReasons,
    );
  }

  const existingLog = await prisma.adminOperationLog.findUnique({
    where: { draftId: parsed.draftId },
  });
  if (existingLog) {
    throw new AssistantActionError("该草稿已执行，请勿重复提交");
  }

  const prepared = await prepareAssistantDraft(parsed);
  if (!prepared.canCommit) {
    throw new AssistantActionError(
      prepared.blockingReasons[0] || "提交前校验未通过",
      prepared.blockingReasons,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const duplicateLog = await tx.adminOperationLog.findUnique({
      where: { draftId: prepared.draftId },
    });
    if (duplicateLog) {
      throw new AssistantActionError("该草稿已执行，请勿重复提交");
    }

    const revalidated = await validateAction(tx, prepared.action);
    if (revalidated.blockingReasons.length > 0) {
      throw new AssistantActionError(
        revalidated.blockingReasons[0],
        revalidated.blockingReasons,
      );
    }

    switch (prepared.action.type) {
      case "createCompetition":
        return createCompetition(tx, prepared);
      case "bulkCreateTeams":
        return bulkCreateTeams(tx, prepared);
      case "bulkCreateMatches":
        return bulkCreateMatches(tx, prepared);
      case "updateMatchScore":
        return updateMatchScore(tx, prepared);
      default:
        throw new AssistantActionError("该操作不支持确认执行");
    }
  });

  return result;
}

export async function getAssistantContext(competitionId?: string) {
  const [competitions, teams, matches, focusCompetition] = await Promise.all([
    prisma.competition.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        season: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: "desc" },
      take: 30,
    }),
    prisma.team.findMany({
      select: {
        id: true,
        competitionId: true,
        name: true,
        competition: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.match.findMany({
      select: {
        id: true,
        competitionId: true,
        startAt: true,
        location: true,
        status: true,
        competition: { select: { id: true, name: true } },
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
        sets: { select: { setNo: true, scoreA: true, scoreB: true } },
      },
      orderBy: { startAt: "desc" },
      take: 80,
    }),
    competitionId
      ? prisma.competition.findUnique({
          where: { id: competitionId },
          include: {
            teams: {
              select: { id: true, name: true },
              orderBy: { name: "asc" },
              take: 50,
            },
            matches: {
              select: {
                id: true,
                startAt: true,
                location: true,
                status: true,
                teamA: { select: { id: true, name: true } },
                teamB: { select: { id: true, name: true } },
              },
              orderBy: { startAt: "asc" },
              take: 60,
            },
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    now: new Date().toISOString(),
    competitions: competitions.map((competition) => ({
      ...competition,
      startDate: competition.startDate?.toISOString() ?? null,
      endDate: competition.endDate?.toISOString() ?? null,
    })),
    teams,
    matches: matches.map((match) => ({
      ...match,
      startAt: match.startAt ? match.startAt.toISOString() : null,
    })),
    // 赛事上下文：管理员在赛事工作区打开助手时，操作默认属于该赛事
    focusCompetition: focusCompetition
      ? {
          id: focusCompetition.id,
          name: focusCompetition.name,
          status: focusCompetition.status,
          season: focusCompetition.season,
          teams: focusCompetition.teams.map((team) => ({
            id: team.id,
            name: team.name,
          })),
          matches: focusCompetition.matches.map((match) => ({
            id: match.id,
            startAt: match.startAt ? match.startAt.toISOString() : null,
            status: match.status,
            teamAName: match.teamA.name,
            teamBName: match.teamB.name,
          })),
        }
      : null,
  };
}
