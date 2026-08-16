"use client";

import type { CompetitionFileItem } from "./competitionTypes";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
} from "lucide-react";

interface FilesTabProps {
  files: CompetitionFileItem[];
}

const typeConfig: Record<string, { icon: typeof File; label: string }> = {
  image: { icon: ImageIcon, label: "图片" },
  pdf: { icon: FileText, label: "PDF" },
  spreadsheet: { icon: FileSpreadsheet, label: "表格" },
  other: { icon: File, label: "文件" },
};

export function FilesTab({ files }: FilesTabProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-900 px-1">赛事资料</h2>
      {files.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <FileText className="w-9 h-9 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无赛事资料</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {files.map((file) => {
            const config = typeConfig[file.type] || typeConfig.other;
            return (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3.5 text-sm text-gray-700 hover:text-blue-600"
              >
                <config.icon className="w-4 h-4 flex-none text-gray-400" />
                <span className="flex-1 min-w-0 truncate">{file.name}</span>
                <span className="text-xs text-gray-400 flex-none">
                  {config.label}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
