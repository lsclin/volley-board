-- CreateTable
CREATE TABLE "AdminOperationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'assistant',
    "operation" TEXT NOT NULL,
    "admin" TEXT NOT NULL DEFAULT 'admin',
    "summary" TEXT NOT NULL,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminOperationLog_draftId_key" ON "AdminOperationLog"("draftId");
