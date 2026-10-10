/**
 * Recebe um schema do Zod e devolve um middleware que valida req.body.
 * Se for inválido, responde 400 com os detalhes. Se for válido, substitui
 * req.body pela versão já validada/tipada e segue pra rota.
 *
 * Uso: router.post("/items", validate(createItemSchema), createItem);
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Dados inválidos.",
        details: result.error.flatten().fieldErrors,
      });
    }

    req.body = result.data;
    next();
  };
}