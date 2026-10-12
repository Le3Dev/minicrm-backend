import { ErroDominio } from "./erros";

/** Resultado de uma operação: sucesso com valor ou falha com erro de domínio. */
export type Resultado<T> = { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly erro: ErroDominio };

export const sucesso = <T>(valor: T): Resultado<T> => ({ ok: true, valor });

export const falha = <T = never>(erro: ErroDominio): Resultado<T> => ({ ok: false, erro });
