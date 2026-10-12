/**
 * Erros de domínio. Cada código é traduzido para um status HTTP apenas na borda
 * (adaptador de entrada), de modo que o domínio não conhece HTTP.
 */
export type CodigoErro =
  | "VALIDACAO"
  | "NAO_AUTENTICADO"
  | "PROIBIDO"
  | "NAO_ENCONTRADO"
  | "CONFLITO"
  | "REGRA_NEGOCIO"
  | "BLOQUEADO"
  | "INDISPONIVEL";

export class ErroDominio extends Error {
  constructor(
    readonly codigo: CodigoErro,
    mensagem: string,
    readonly detalhes?: Record<string, unknown>,
  ) {
    super(mensagem);
    this.name = new.target.name;
  }
}

export class ErroValidacao extends ErroDominio {
  constructor(mensagem: string, detalhes?: Record<string, unknown>) {
    super("VALIDACAO", mensagem, detalhes);
  }
}

export class RegistroNaoEncontrado extends ErroDominio {
  constructor(entidade: string, id?: string) {
    super("NAO_ENCONTRADO", `${entidade} não encontrado(a).`, id ? { id } : undefined);
  }
}

export class AcessoNegado extends ErroDominio {
  constructor(mensagem = "Você não tem permissão para esta operação.") {
    super("PROIBIDO", mensagem);
  }
}

export class ViolacaoRegraNegocio extends ErroDominio {
  constructor(readonly regra: string, mensagem: string) {
    super("REGRA_NEGOCIO", mensagem, { regra });
  }
}

export class ConflitoConcorrencia extends ErroDominio {
  constructor(entidade: string) {
    super("CONFLITO", `${entidade} foi alterado(a) por outra operação. Recarregue e tente novamente.`);
  }
}
