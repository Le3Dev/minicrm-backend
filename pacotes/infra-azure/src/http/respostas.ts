import type { HttpResponseInit } from "@azure/functions";
import type { CodigoErro, ErroDominio } from "@minicrm/nucleo/dominio";

const STATUS: Record<CodigoErro, number> = {
  VALIDACAO: 400,
  NAO_AUTENTICADO: 401,
  PROIBIDO: 403,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  REGRA_NEGOCIO: 422,
  BLOQUEADO: 423,
  INDISPONIVEL: 503,
};

export const statusDoErro = (codigo: CodigoErro): number => STATUS[codigo];

/** Resposta de erro no formato Problem Details (RFC 9457). */
export function respostaErro(erro: ErroDominio, correlacao: string): HttpResponseInit {
  return {
    status: STATUS[erro.codigo],
    headers: { "content-type": "application/problem+json", "x-correlation-id": correlacao },
    jsonBody: { tipo: erro.codigo, titulo: erro.message, status: STATUS[erro.codigo], ...(erro.detalhes ?? {}) },
  };
}

export function respostaErroInterno(correlacao: string): HttpResponseInit {
  return {
    status: 500,
    headers: { "content-type": "application/problem+json", "x-correlation-id": correlacao },
    jsonBody: { tipo: "ERRO_INTERNO", titulo: "Erro inesperado. Tente novamente.", status: 500 },
  };
}
