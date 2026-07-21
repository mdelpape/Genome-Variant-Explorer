import { error, handle, ok } from "@/lib/api";
import { EmptyVcfError, ingestVcf } from "@/server/services/ingest-service";
import { uploadFileSchema } from "@/server/validation/schemas";

// Streaming ingestion needs the Node runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow long-running parses of large uploads.
export const maxDuration = 300;

/**
 * POST /api/upload
 *
 * Accepts a multipart form with a single `file` field, validates it is a VCF,
 * streams it through the parser, and persists the variants. Responds with the
 * new dataset id so the client can redirect to the dataset page.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return error("No file was provided under the 'file' field", 400);
    }

    const validation = uploadFileSchema.safeParse({
      filename: file.name,
      size: file.size,
    });
    if (!validation.success) {
      return error(
        "Invalid file",
        400,
        validation.error.flatten().fieldErrors,
      );
    }

    try {
      const result = await ingestVcf(file.name, file.stream());
      return ok(result, { status: 201 });
    } catch (err) {
      if (err instanceof EmptyVcfError) {
        return error(err.message, 422);
      }
      throw err;
    }
  });
}
