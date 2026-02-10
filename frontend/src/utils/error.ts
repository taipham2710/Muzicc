/**
 * Kiểm tra lỗi có phải do không kết nối được server (backend chưa chạy).
 */
export function isNetworkError(err: unknown): boolean {
  if (err == null || typeof err !== "object") return false;
  const e = err as { message?: string; response?: unknown; code?: string };
  if (e.message === "Network Error") return true;
  if (e.code === "ERR_NETWORK") return true;
  if (e.response == null && e.message) return true; // Axios: no response = network issue
  return false;
}
