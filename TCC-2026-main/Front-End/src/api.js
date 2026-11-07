const DEFAULT_API_URL = "https://tcc-2-0.onrender.com";
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

function isLocalApiUrl(value) {
  if (!value) return false;

  try {
    const hostname = new URL(value).hostname;
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
  } catch {
    return true;
  }
}

const pageHostname = typeof window !== "undefined"
  ? window.location.hostname
  : "localhost";
const isDeployedPage = !["localhost", "127.0.0.1", "::1", "[::1]"].includes(pageHostname);

// Uma variável VITE_API_URL local não pode fazer o site publicado chamar
// o localhost do computador de quem está jogando.
const selectedApiUrl = (
  isDeployedPage && isLocalApiUrl(configuredApiUrl)
    ? DEFAULT_API_URL
    : configuredApiUrl || DEFAULT_API_URL
);

function removeTrailingSlashes(value) {
  let result = value;
  while (result.endsWith("/")) result = result.slice(0, -1);
  return result;
}

const API_BASE_URL = removeTrailingSlashes(selectedApiUrl);

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
