"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VCF_EXTENSIONS } from "@/server/validation/schemas";

/** Human-readable byte size. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

function isVcf(file: File): boolean {
  return VCF_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

/**
 * Drag-and-drop file picker with client-side VCF validation. Purely
 * presentational with respect to uploading: it hands the selected file to the
 * parent, which owns the upload lifecycle.
 */
export function FileDropzone({
  file,
  onSelect,
  onClear,
  disabled,
  onReject,
}: {
  file: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  onReject?: (message: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const selected = files?.[0];
      if (!selected) return;
      if (!isVcf(selected)) {
        onReject?.("Only .vcf files are supported.");
        return;
      }
      onSelect(selected);
    },
    [onSelect, onReject],
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  if (file) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </p>
          </div>
        </div>
        {!disabled ? (
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-input hover:border-primary/50 hover:bg-muted/40",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UploadCloud className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium">
        Drag &amp; drop a VCF file, or click to browse
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Supported: {VCF_EXTENSIONS.join(", ")}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={VCF_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
