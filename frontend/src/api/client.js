export const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();

    if (!token) {
      throw new Error("Please sign in again.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: "PUT", body }),
  del: (path, opts) => apiFetch(path, { ...opts, method: "DELETE" }),
};
