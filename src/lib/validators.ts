import { z } from "zod";

export const attendanceSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  status: z.enum(["expected", "arrived", "cancelled"]),
});

export const createActivitySchema = z.object({
  title: z.string().min(1, "Title is required").default("今晚野球"),
  type: z.enum(["pickup", "training", "friendly", "match"]).default("pickup"),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().min(1, "Location is required"),
  note: z.string().nullable().optional(),
  visible: z.boolean().default(true),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["pickup", "training", "friendly", "match"]).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  location: z.string().min(1).optional(),
  note: z.string().nullable().optional(),
  status: z.enum(["scheduled", "live", "ended", "cancelled"]).optional(),
  visible: z.boolean().optional(),
  manualExpectedDelta: z.number().int().optional(),
  manualArrivedDelta: z.number().int().optional(),
});

export const createMatchSchema = z.object({
  competitionId: z.string().nullable().optional(),
  startAt: z.string().datetime(),
  location: z.string().min(1, "Location is required"),
  teamAId: z.string().min(1),
  teamBId: z.string().min(1),
  note: z.string().nullable().optional(),
  sets: z
    .array(
      z.object({
        setNo: z.number().int().min(1),
        scoreA: z.number().int().min(0),
        scoreB: z.number().int().min(0),
      }),
    )
    .optional(),
});

export const updateMatchSchema = z.object({
  competitionId: z.string().nullable().optional(),
  startAt: z.string().datetime().optional(),
  location: z.string().min(1).optional(),
  teamAId: z.string().min(1).optional(),
  teamBId: z.string().min(1).optional(),
  status: z.enum(["scheduled", "finished", "cancelled"]).optional(),
  note: z.string().nullable().optional(),
  sets: z
    .array(
      z.object({
        setNo: z.number().int().min(1),
        scoreA: z.number().int().min(0),
        scoreB: z.number().int().min(0),
      }),
    )
    .optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  note: z.string().nullable().optional(),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;

export const createCompetitionSchema = z.object({
  name: z.string().min(1, "赛事名称必填"),
  description: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export const updateCompetitionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  status: z.enum(["upcoming", "ongoing", "finished", "archived"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type UpdateCompetitionInput = z.infer<typeof updateCompetitionSchema>;
