const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function buildUrl(path) {
  if (!API_URL) return path;
  return `${API_URL}${path}`;
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const data = await response.json();
      message = data.erreur || data.detail || message;
    } catch {}
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function fetchStore(key, fallback) {
  try {
    const data = await apiFetch(`/api/store/${key}`);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveStore(key, value) {
  return apiFetch(`/api/store/${key}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export default API_URL;
