import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Small helpers for consistent JSON API responses and centralised error
 * handling across every route handler.
 */

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function error(
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Wrap a route handler body in unified error handling: Zod validation issues
 * become 400s, everything else a 500 with the message logged server-side.
 */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      return error("Invalid request parameters", 400, err.flatten());
    }
    console.error("[api] unhandled error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return error(message, 500);
  }
}
