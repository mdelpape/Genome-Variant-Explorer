"use client";

import { useCallback, useRef, useState } from "react";
import type { IngestResult } from "@/server/services/ingest-service";
import type { ApiError } from "@/lib/api-client";

/**
 * Upload hook backed by XMLHttpRequest so we can report real upload progress
 * (the fetch API cannot observe request-body upload progress). Exposes a small
 * state machine the upload UI can render from.
 */
export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UseUploadResult {
  status: UploadStatus;
  progress: number; // 0-100
  error: string | null;
  result: IngestResult | null;
  upload: (file: File) => Promise<IngestResult>;
  reset: () => void;
}

export function useUpload(): UseUploadResult {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResult | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    xhrRef.current?.abort();
    setStatus("idle");
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const upload = useCallback((file: File) => {
    return new Promise<IngestResult>((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", "/api/upload");

      setStatus("uploading");
      setProgress(0);
      setError(null);
      setResult(null);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          // fall through to error handling below
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          const ingest = body as IngestResult;
          setProgress(100);
          setStatus("success");
          setResult(ingest);
          resolve(ingest);
        } else {
          const message =
            (body as { error?: string })?.error ??
            `Upload failed (${xhr.status})`;
          const err = new Error(message) as ApiError;
          err.status = xhr.status;
          setStatus("error");
          setError(message);
          reject(err);
        }
      };

      xhr.onerror = () => {
        const message = "Network error during upload";
        setStatus("error");
        setError(message);
        reject(new Error(message));
      };

      xhr.send(form);
    });
  }, []);

  return { status, progress, error, result, upload, reset };
}
