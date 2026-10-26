import type { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ErroDominio, falha, sucesso, type Resultado } from "@minicrm/nucleo/dominio";
import type { IManipulador, UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { IAutenticador } from "../auth/autenticador";
import { respostaErro, respostaErroInterno } from "./respostas";

export interface OpcoesFuncaoHttp {
  /** Rotas públicas (login, recuperação de senha) não exigem JWT. */
  publica?: boolean;
  statusSucesso?: number;
}

/**
 * Adaptador de entrada HTTP de uma fatia (Template Method).
 * A classe base cuida de autenticação, correlação, tradução de erros e serialização;
 * cada fatia só implementa `montarComando`, convertendo a requisição no comando do caso de uso.
 */
export abstract class FuncaoHttp<C, R> {
  protected constructor(
    protected readonly manipulador: IManipulador<C, R>,
    private readonly autenticador: IAutenticador,
    private readonly opcoes: OpcoesFuncaoHttp = {},
  ) {}

  protected abstract montarComando(req: HttpRequest, usuario: UsuarioAutenticado | null): Promise<Resultado<C>>;

  async tratar(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
    const correlacao = req.headers.get("x-correlation-id") ?? globalThis.crypto.randomUUID();
    try {
      let usuario: UsuarioAutenticado | null = null;
      if (!this.opcoes.publica) {
        usuario = await this.autenticador.autenticar(req);
        if (!usuario) return respostaErro(new ErroDominio("NAO_AUTENTICADO", "Sessão inválida ou expirada."), correlacao);
      }
      const comando = await this.montarComando(req, usuario);
      if (!comando.ok) return respostaErro(comando.erro, correlacao);
      const resultado = await this.manipulador.executar(comando.valor);
      if (!resultado.ok) return respostaErro(resultado.erro, correlacao);
      return this.respostaSucesso(resultado.valor, correlacao);
    } catch (erro) {
      ctx.error(`[${correlacao}] Falha não tratada em ${ctx.functionName}`, erro);
      return respostaErroInterno(correlacao);
    }
  }

  protected respostaSucesso(valor: R, correlacao: string): HttpResponseInit {
    const status = this.opcoes.statusSucesso ?? 200;
    return {
      status,
      headers: { "x-correlation-id": correlacao },
      ...(status === 204 || valor === undefined ? {} : { jsonBody: valor }),
    };
  }
}

/** Lê o corpo JSON da requisição; corpo vazio ou inválido vira objeto vazio (a validação acusa os campos). */
export async function lerJson(req: HttpRequest): Promise<Record<string, unknown>> {
  try {
    const texto = await req.text();
    if (!texto) return {};
    const corpo: unknown = JSON.parse(texto);
    return typeof corpo === "object" && corpo !== null ? (corpo as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Parâmetros de query como objeto simples, para validação. */
export function lerQuery(req: HttpRequest): Record<string, string> {
  return Object.fromEntries(req.query.entries());
}

/** Junta a entrada validada com o usuário autenticado, formando o comando do caso de uso. */
export function comUsuario<E extends object>(
  entrada: Resultado<E>,
  usuario: UsuarioAutenticado | null,
): Resultado<E & { usuario: UsuarioAutenticado }> {
  if (!entrada.ok) return falha(entrada.erro);
  if (!usuario) return falha(new ErroDominio("NAO_AUTENTICADO", "Sessão inválida ou expirada."));
  return sucesso({ ...entrada.valor, usuario });
}
