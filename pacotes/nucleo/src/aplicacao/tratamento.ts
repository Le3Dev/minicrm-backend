import { ErroDominio } from "../dominio/erros";
import { falha, type Resultado } from "../dominio/resultado";

/**
 * Converte erros de domínio lançados durante o caso de uso em `Resultado` de falha.
 * Erros inesperados continuam sendo lançados para o adaptador tratar como erro interno.
 */
export async function executarComTratamento<R>(trabalho: () => Promise<Resultado<R>>): Promise<Resultado<R>> {
  try {
    return await trabalho();
  } catch (erro) {
    if (erro instanceof ErroDominio) return falha(erro);
    throw erro;
  }
}
