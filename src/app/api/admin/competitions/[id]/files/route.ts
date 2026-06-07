import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) {
      return Response.json({ error: "赛事不存在" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "未选择文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\u4e00-\u9fff_-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);

    const fileUrl = `/uploads/${safeName}`;
    const fileType = file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)
      ? "image"
      : file.name.match(/\.(pdf)$/i)
        ? "pdf"
        : file.name.match(/\.(xlsx?|csv)$/i)
          ? "spreadsheet"
          : "other";

    const record = await prisma.competitionFile.create({
      data: {
        competitionId: id,
        name: file.name,
        url: fileUrl,
        type: fileType,
      },
    });

    return Response.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to upload file:", error);
    return Response.json({ error: "文件上传失败" }, { status: 500 });
  }
}