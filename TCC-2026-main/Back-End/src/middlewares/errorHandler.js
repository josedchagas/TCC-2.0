/**
 * Pega qualquer erro não tratado que aconteça dentro de uma rota (desde que
 * a rota seja uma função async e os erros sejam passados pro "next").
 * Fica registrado no server.js como o último "app.use(...)".
 */
export function errorHandler(err, req, res, next) {
  console.error(err);

  // Erro de chave única do Postgres (ex: email ou username repetido).
  if (err.code === "23505") {
    return res.status(409).json({ error: "Esse registro já existe." });
  }

  // Erro de chave estrangeira (ex: apagar um item que ainda está num inventário).
  if (err.code === "23503") {
    return res.status(409).json({
      error: "Operação bloqueada: esse registro está sendo usado por outro (ex: item em algum inventário ou equipado).",
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    // Não expõe mensagens internas, SQL ou detalhes de configuração em produção.
    error: status >= 500 ? "Erro interno no servidor." : (err.message || "Não foi possível concluir a operação."),
  });
}

/**
 * Evita repetir try/catch em toda rota async — embrulha a rota e manda
 * qualquer erro direto pro errorHandler.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}