import { error, handle, ok } from "@/lib/api";
import { getDatasetStats } from "@/server/services/dataset-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const stats = await getDatasetStats(id);
    if (!stats) return error("Dataset not found", 404);
    return ok(stats);
  });
}
