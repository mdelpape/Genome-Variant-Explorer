import { handle, ok } from "@/lib/api";
import { getDashboardStats } from "@/server/services/dashboard-service";

// Aggregations depend on live data, so never cache this route.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return handle(async () => ok(await getDashboardStats()));
}
