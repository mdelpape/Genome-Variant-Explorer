import { handle, ok } from "@/lib/api";
import { listVariants } from "@/server/services/variant-service";
import { parseQuery, variantQuerySchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return handle(async () => {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(variantQuerySchema, searchParams);
    return ok(await listVariants(query));
  });
}
