import { handle, ok } from "@/lib/api";
import { listDatasets } from "@/server/services/dataset-service";
import { datasetQuerySchema, parseQuery } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parseQuery(datasetQuerySchema, searchParams);
    return ok(await listDatasets(page, pageSize));
  });
}
