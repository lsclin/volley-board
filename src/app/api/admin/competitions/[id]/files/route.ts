import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createCompetitionFileSchema } from "@/lib/validators";
import {
  inferCompetitionFileType,
  MAX_COMPETITION_FILE_UPLOAD_BYTES,
  uploadCompetitionFileToStorage,
} from "@/lib/fileStorage";

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value
  );
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

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!isUploadFile(file) || file.size === 0) {
        return Response.json({ error: "请选择要上传的文件" }, { status: 400 });
      }

      if (file.size > MAX_COMPETITION_FILE_UPLOAD_BYTES) {
        return Response.json(
          { error: "文件不能超过 20MB" },
          { status: 400 },
        );
      }

      const uploaded = await uploadCompetitionFileToStorage({
        competitionId: id,
        file,
      });

      const record = await prisma.competitionFile.create({
        data: {
          competitionId: id,
          name: uploaded.name,
          url: uploaded.url,
          type: uploaded.type,
        },
      });

      return Response.json(record, { status: 201 });
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
    const fileType = data.type || inferCompetitionFileType(data.name, data.url);

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
    if (error instanceof Error && error.message.includes("Supabase Storage 未配置")) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    console.error("Failed to save competition file link:", error);
    return Response.json({ error: "资料保存失败" }, { status: 500 });
  }
}
