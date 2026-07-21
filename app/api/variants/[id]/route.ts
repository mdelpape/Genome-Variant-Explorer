import { error, handle, ok } from "@/lib/api";
import { getVariantById } from "@/server/services/variant-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const variant = await getVariantById(id);
    if (!variant) return error("Variant not found", 404);
    return ok(variant);
  });
}
