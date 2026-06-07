import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    await requireAdmin();
    const { id, fileId } = await params;

    const file = await prisma.competitionFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.competitionId !== id) {
      return Response.json({ error: "文件不存在" }, { status: 404 });
    }

    // Try to delete the physical file
    try {
      const filePath = path.join(process.cwd(), "public", file.url);
      await unlink(filePath);
    } catch {
      // File might not exist on disk, that's ok
    }

    await prisma.competitionFile.delete({ where: { id: fileId } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to delete file:", error);
    return Response.json({ error: "删除文件失败" }, { status: 500 });
  }
}