import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const MAX_COMPETITION_FILE_UPLOAD_BYTES = 20 * 1024 * 1024;

export type CompetitionFileType = "image" | "pdf" | "spreadsheet" | "other";

type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

function getSupabaseStorageConfig(): SupabaseStorageConfig | null {
  const url = (
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!url || !serviceRoleKey || !bucket) return null;

  return { url, serviceRoleKey, bucket };
}

function requireSupabaseStorageConfig(): SupabaseStorageConfig {
  const config = getSupabaseStorageConfig();
  if (!config) {
    throw new Error(
      "Supabase Storage 未配置，请设置 SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY 和 SUPABASE_STORAGE_BUCKET",
    );
  }
  return config;
}

function getSupabaseClient() {
  const config = requireSupabaseStorageConfig();
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function inferCompetitionFileType(
  name: string,
  urlOrMimeType = "",
): CompetitionFileType {
  const target = `${name} ${urlOrMimeType}`;

  if (
    urlOrMimeType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(target)
  ) {
    return "image";
  }

  if (urlOrMimeType === "application/pdf" || /\.pdf(\?|#|$)/i.test(target)) {
    return "pdf";
  }

  if (
    /spreadsheet|excel|csv/i.test(urlOrMimeType) ||
    /\.(xlsx?|csv)(\?|#|$)/i.test(target)
  ) {
    return "spreadsheet";
  }

  return "other";
}

function sanitizeObjectFileName(fileName: string) {
  const extension = fileName.match(/\.[^.]+$/)?.[0].toLowerCase() ?? "";
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const safeBase =
    baseName
      .normalize("NFKD")
      .replace(/[^\w-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "file";
  const safeExtension = extension.replace(/[^\w.]/g, "");

  return `${safeBase}${safeExtension}`;
}

function buildCompetitionObjectPath(competitionId: string, fileName: string) {
  return [
    "competitions",
    competitionId,
    `${Date.now()}-${randomUUID()}-${sanitizeObjectFileName(fileName)}`,
  ].join("/");
}

export async function uploadCompetitionFileToStorage({
  competitionId,
  file,
}: {
  competitionId: string;
  file: File;
}) {
  const config = requireSupabaseStorageConfig();
  const supabase = getSupabaseClient();
  const objectPath = buildCompetitionObjectPath(competitionId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(config.bucket)
    .upload(objectPath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`文件上传失败：${error.message}`);
  }

  const { data } = supabase.storage.from(config.bucket).getPublicUrl(objectPath);

  return {
    name: file.name,
    url: data.publicUrl,
    type: inferCompetitionFileType(file.name, file.type),
  };
}

function getObjectPathFromSupabasePublicUrl(fileUrl: string) {
  const config = getSupabaseStorageConfig();
  if (!config) return null;

  const publicPrefix = `${config.url}/storage/v1/object/public/${config.bucket}/`;
  if (!fileUrl.startsWith(publicPrefix)) return null;

  const rawPath = fileUrl.slice(publicPrefix.length).split("?")[0];
  if (!rawPath) return null;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

export async function deleteCompetitionFileFromStorage(fileUrl: string) {
  const objectPath = getObjectPathFromSupabasePublicUrl(fileUrl);
  if (!objectPath) return false;

  const config = requireSupabaseStorageConfig();
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(config.bucket).remove([objectPath]);

  if (error) {
    throw new Error(`云存储文件删除失败：${error.message}`);
  }

  return true;
}
