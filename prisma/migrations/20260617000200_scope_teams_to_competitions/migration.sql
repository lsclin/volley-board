-- Scope teams to competitions while keeping old teams nullable for compatibility.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT,
    "name" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "Team_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Team" ("id", "name", "note")
SELECT "id", "name", "note" FROM "Team";

DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";

CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT,
    "startAt" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "teamAId" TEXT NOT NULL,
    "teamBId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "note" TEXT,
    CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Match" ("id", "competitionId", "startAt", "location", "teamAId", "teamBId", "status", "note")
SELECT "id", "competitionId", "startAt", "location", "teamAId", "teamBId", "status", "note" FROM "Match";

DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";

UPDATE "Team"
SET "competitionId" = (
    SELECT MIN("competitionId")
    FROM "Match"
    WHERE ("teamAId" = "Team"."id" OR "teamBId" = "Team"."id")
      AND "competitionId" IS NOT NULL
)
WHERE (
    SELECT COUNT(DISTINCT "competitionId")
    FROM "Match"
    WHERE ("teamAId" = "Team"."id" OR "teamBId" = "Team"."id")
      AND "competitionId" IS NOT NULL
) = 1;

CREATE INDEX "Team_competitionId_idx" ON "Team"("competitionId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
