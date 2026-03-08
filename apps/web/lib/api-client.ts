import { getAuthToken } from "@/lib/hooks/use-auth";

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Thin fetch wrapper that attaches the Bearer token from the auth store.
 *
 * Usage:
 *   const res = await apiClient<UploadResponse>("/api/uploads", {
 *     method: "POST",
 *     body: formData,
 *   });
 *   if (res.success) { ... }
 */
export async function apiClient<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const body = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: body.error ?? `Request failed (${response.status})`,
      };
    }

    return { success: true, data: body.data as T };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
