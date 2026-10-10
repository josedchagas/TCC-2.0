import { verifyToken } from "../utils/jwt.js";

const SESSION_COOKIE = "rpg_session";

function tokenFromRequest(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);

  const cookieHeader = req.headers.cookie ?? "";
  const entry = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!entry) return null;
  try { return decodeURIComponent(entry.slice(SESSION_COOKIE.length + 1)); }
  catch { return null; }
}

export function requireAuth(req, res, next) {
  const token = tokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "Sessão não encontrada." });
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

export function optionalAuth(req, _res, next) {
  const token = tokenFromRequest(req);
  if (token) {
    try { req.user = verifyToken(token); }
    catch { /* Token expirado/inválido: o controlador cria uma nova sessão. */ }
  }
  next();
}

export function setSessionCookie(res, token, maxAge = 7 * 24 * 60 * 60 * 1000) {
  const production = process.env.NODE_ENV === "production";
  const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: production || sameSite === "none",
    sameSite,
    maxAge,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  const production = process.env.NODE_ENV === "production";
  const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: production || sameSite === "none",
    sameSite,
    path: "/",
  });
}
