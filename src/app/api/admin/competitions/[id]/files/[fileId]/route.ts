import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteCompetitionFileFromStorage } from "@/lib/fileStorage";

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
      return Response.json({ error: "资料不存在" }, { status: 404 });
    }

    try {
      await deleteCompetitionFileFromStorage(file.url);
    } catch (error) {
      console.error("Failed to delete uploaded competition file:", error);
    }

    await prisma.competitionFile.delete({ where: { id: fileId } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to delete competition file link:", error);
    return Response.json({ error: "删除资料失败" }, { status: 500 });
  }
}
