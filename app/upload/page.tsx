"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpload } from "@/hooks/use-upload";
import { formatNumber } from "@/utils/format";

export default function UploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const { status, progress, upload, reset } = useUpload();

  const isUploading = status === "uploading";

  const handleUpload = async () => {
    if (!file) return;
    try {
      const result = await upload(file);
      // Invalidate cached lists so the new dataset appears immediately.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["variants"] });
      toast.success(
        `Parsed ${formatNumber(result.variantCount)} variants from ${file.name}`,
      );
      router.push(`/datasets/${result.datasetId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const clear = () => {
    setFile(null);
    reset();
  };

  return (
    <>
      <PageHeader
        title="Upload dataset"
        description="Upload a VCF file. Variants are parsed and stored automatically."
      />

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">VCF file</CardTitle>
            <CardDescription>
              We parse standard VCF columns and extract gene and clinical
              significance annotations from the INFO field when available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileDropzone
              file={file}
              onSelect={setFile}
              onClear={clear}
              disabled={isUploading}
              onReject={(message) => toast.error(message)}
            />

            {isUploading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress < 100 ? "Uploading…" : "Parsing variants…"}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} />
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              {file && !isUploading ? (
                <Button variant="ghost" onClick={clear}>
                  Cancel
                </Button>
              ) : null}
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? "Processing" : "Upload & parse"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
