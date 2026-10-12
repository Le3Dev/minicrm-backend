import { z } from "zod";

/** Todas as listagens são paginadas em 20 registros (RF18). */
export const TAMANHO_PAGINA = 20;

export interface Pagina<T> {
  readonly itens: T[];
  readonly total: number;
  readonly pagina: number;
  readonly tamanhoPagina: number;
}

export const esquemaPagina = z.coerce.number().int().min(1).default(1);

export const paginar = <T>(itens: T[], total: number, pagina: number): Pagina<T> => ({
  itens,
  total,
  pagina,
  tamanhoPagina: TAMANHO_PAGINA,
});
