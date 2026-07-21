/**
 * Thin typed fetch wrapper used by the client-side data hooks. Centralises
 * base-URL handling, query-string serialisation and error unwrapping so the
 * hooks stay declarative.
 */

export interface ApiError extends Error {
  status: number;
  details?: unknown;
}

/**
 * Query parameter bag accepted by the client. Typed as `object` (rather than
 * `Record<string, unknown>`) so plain interfaces — which lack an implicit index
 * signature — can be passed directly without casting.
 */
export type QueryParams = object;

function toQueryString(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function apiGet<T>(
  path: string,
  params?: QueryParams,
): Promise<T> {
  const response = await fetch(`${path}${toQueryString(params)}`, {
    headers: { Accept: "application/json" },
  });
  return unwrap<T>(response);
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(path, { method: "POST", body: formData });
  return unwrap<T>(response);
}

async function unwrap<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const err = new Error(
      (body && body.error) || `Request failed (${response.status})`,
    ) as ApiError;
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body as T;
}
