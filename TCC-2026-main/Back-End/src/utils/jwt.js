import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET não encontrada no .env. Veja o .env.example pra saber como gerar uma."
  );
}

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = "7d"; // token válido por 7 dias

export function signToken(payload, expiresIn = EXPIRES_IN) {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET); // lança erro se inválido/expirado
}