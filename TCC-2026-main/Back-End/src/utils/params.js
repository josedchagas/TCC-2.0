/**
 * Converte um parâmetro da URL (sempre string) em um ID inteiro positivo.
 * Devolve null se for inválido (ex: "abc", "-1", "1.5") — assim a rota
 * responde 400 em vez de mandar lixo pro banco.
 */
export function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}