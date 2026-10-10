import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, "Username precisa ter no mínimo 3 letras.").max(32),
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "Senha precisa ter no mínimo 6 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "Senha é obrigatória."),
});