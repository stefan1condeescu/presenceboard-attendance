import { API_BASE_URL, getToken } from "./client.js";

export async function downloadCsv(urlPath, filename = "attendance.csv") {
  const token = getToken();
  const url = `${API_BASE_URL}${urlPath}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const raw = await res.text();
    let message = `CSV export failed (${res.status})`;

    try {
      const data = JSON.parse(raw);
      message = data?.message || data?.error || message;
    } catch {
      if (raw && raw.trim()) {
        message = raw.replace(/<[^>]*>/g, "").trim().slice(0, 180) || message;
      }
    }

    throw new Error(message);
  }

  const blob = await res.blob();
  const link = document.createElement("a");
  const objectUrl = window.URL.createObjectURL(blob);

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
