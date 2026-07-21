import { handle, ok } from "@/lib/api";
import { getVariantFilterOptions } from "@/server/services/variant-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Powers the chromosome / clinical-significance facet dropdowns on the
// variants table.
export async function GET() {
  return handle(async () => ok(await getVariantFilterOptions()));
}
