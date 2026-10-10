const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Erro na API (${response.status}).`);
  }
  return data;
}

// Evita duas criações de conta durante o remount extra do React StrictMode em desenvolvimento.
let guestSessionPromise;
export function ensureGuestSession() {
  if (!guestSessionPromise) {
    guestSessionPromise = apiFetch("/auth/guest", { method: "POST" }).catch((error) => {
      guestSessionPromise = undefined;
      throw error;
    });
  }
  return guestSessionPromise;
}
