import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createCompetitionFileSchema } from "@/lib/validators";

function inferFileType(name: string, url: string) {
  const target = `${name} ${url}`;
  if (/\.(png|jpg|jpeg|gif|webp)(\?|#|$)/i.test(target)) return "image";
  if (/\.pdf(\?|#|$)/i.test(target)) return "pdf";
  if (/\.(xlsx?|csv)(\?|#|$)/i.test(target)) return "spreadsheet";
  return "other";
}

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

    const body = await request.json().catch(() => null);
    const parsed = createCompetitionFileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "资料信息不完整" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const fileType = data.type || inferFileType(data.name, data.url);

    const record = await prisma.competitionFile.create({
      data: {
        competitionId: id,
        name: data.name,
        url: data.url,
        type: fileType,
      },
    });

    return Response.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to save competition file link:", error);
    return Response.json({ error: "资料保存失败" }, { status: 500 });
  }
}
