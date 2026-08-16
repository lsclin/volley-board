"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { FileText, LinkIcon, Trash2, Upload } from "lucide-react";

export interface CompetitionFileView {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface CompetitionFilesPanelProps {
  competitionId: string;
  files: CompetitionFileView[];
  /** 资料变化后回调（重新拉取赛事数据） */
  onChanged: () => void;
}

export function CompetitionFilesPanel({
  competitionId,
  files,
  onChanged,
}: CompetitionFilesPanelProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [fileForm, setFileForm] = useState({ name: "", url: "", type: "other" });
  const [fileError, setFileError] = useState("");
  const [savingFile, setSavingFile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const closeLinkDialog = () => {
    setShowLinkDialog(false);
    setFileError("");
    setSavingFile(false);
  };

  const handleLinkCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSavingFile(true);
    setFileError("");

    const res = await fetch(`/api/admin/competitions/${competitionId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fileForm.name.trim(),
        url: fileForm.url.trim(),
        type: fileForm.type,
      }),
    });

    setSavingFile(false);

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setFileError(err?.error || "保存资料失败");
      return;
    }

    onChanged();
    closeLinkDialog();
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/admin/competitions/${competitionId}/files`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          alert(err?.error || "上传资料失败");
          return;
        }

        onChanged();
      } catch {
        alert("上传失败，请检查网络后重试");
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("确定删除这份资料吗？")) return;
    await fetch(`/api/admin/competitions/${competitionId}/files/${fileId}`, {
      method: "DELETE",
    });
    onChanged();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setFileForm({ name: "", url: "", type: "other" });
            setFileError("");
            setShowLinkDialog(true);
          }}
        >
          <LinkIcon className="w-3.5 h-3.5 mr-1" />
          添加资料链接
        </Button>
        <Button size="sm" onClick={handleUpload} loading={uploading}>
          <Upload className="w-3.5 h-3.5 mr-1" />
          上传本地文件
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          暂无资料。可添加网盘/在线文档链接，或上传本地文件（保存到 Supabase Storage）。
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5"
            >
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 min-w-0 text-sm text-gray-600 hover:text-blue-600"
              >
                <FileText className="w-4 h-4 flex-none" />
                <span className="truncate">{file.name}</span>
              </a>
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="p-1 text-gray-400 hover:text-red-500"
                aria-label={`删除 ${file.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={showLinkDialog}
        onClose={closeLinkDialog}
        title="添加资料链接"
      >
        <form className="space-y-4" onSubmit={handleLinkCreate}>
          <p className="text-sm leading-6 text-gray-500">
            将文件放在网盘、在线文档或资料库后，把可访问链接保存到这里。
          </p>
          <Input
            label="资料名称"
            value={fileForm.name}
            onChange={(e) =>
              setFileForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="例如：竞赛规程 PDF"
          />
          <Input
            label="资料链接"
            value={fileForm.url}
            onChange={(e) =>
              setFileForm((prev) => ({ ...prev, url: e.target.value }))
            }
            placeholder="https://..."
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="competition-file-type"
              className="text-sm font-medium text-gray-700"
            >
              类型
            </label>
            <select
              id="competition-file-type"
              value={fileForm.type}
              onChange={(e) =>
                setFileForm((prev) => ({ ...prev, type: e.target.value }))
              }
              className="min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="other">其他</option>
              <option value="pdf">PDF</option>
              <option value="spreadsheet">表格</option>
              <option value="image">图片</option>
            </select>
          </div>
          {fileError ? (
            <p className="text-sm text-red-600">{fileError}</p>
          ) : null}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeLinkDialog}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={savingFile}
              disabled={!fileForm.name.trim() || !fileForm.url.trim()}
            >
              保存资料
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
