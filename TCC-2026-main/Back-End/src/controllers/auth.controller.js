import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { signToken } from "../utils/jwt.js";
import { clearSessionCookie, setSessionCookie } from "../middlewares/auth.js";

const SALT_ROUNDS = 10;

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email ?? null,
    role: user.role ?? "player",
    isAnonymous: Boolean(user.isAnonymous),
    createdAt: user.createdAt,
  };
}

function authenticateResponse(res, user, status = 200, includeToken = true) {
  const anonymous = Boolean(user.isAnonymous);
  const token = signToken({ id: user.id, username: user.username }, anonymous ? "365d" : undefined);
  // Conta anônima renova a sessão por até um ano a cada visita; conta convencional mantém 7 dias.
  setSessionCookie(res, token, anonymous ? 365 * 24 * 60 * 60 * 1000 : undefined);
  const payload = { user: publicUser(user) };
  // Mantém compatibilidade com o login tradicional; conta anônima usa somente cookie HttpOnly.
  if (includeToken) payload.token = token;
  return res.status(status).json(payload);
}

export async function register(req, res) {
  const { username, email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();
  const existing = await db.select({ id: users.id }).from(users)
    .where(or(eq(users.email, normalizedEmail), eq(users.username, normalizedUsername)));
  if (existing.length > 0) return res.status(409).json({ error: "Username ou email já cadastrado." });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [user] = await db.insert(users).values({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    role: "player",
    isAnonymous: false,
  }).returning();
  return authenticateResponse(res, user, 201);
}

export async function login(req, res) {
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Email ou senha incorretos." });
  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) return res.status(401).json({ error: "Email ou senha incorretos." });
  return authenticateResponse(res, user);
}

// Cria uma conta na primeira visita e reutiliza o usuário identificado pelo cookie nas seguintes.
export async function guest(req, res) {
  if (req.user?.id) {
    const [existingUser] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (existingUser) return authenticateResponse(res, existingUser, 200, false);
  }

  const username = `visitante_${randomBytes(8).toString("hex")}`;
  const [user] = await db.insert(users).values({
    username,
    email: null,
    passwordHash: null,
    role: "player",
    isAnonymous: true,
  }).returning();
  return authenticateResponse(res, user, 201, false);
}

export async function logout(_req, res) {
  clearSessionCookie(res);
  res.status(204).send();
}

export async function me(req, res) {
  const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
  res.json({ user: publicUser(user) });
}
