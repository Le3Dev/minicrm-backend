import type { CardFunil } from "../../dominio/funil";

export interface FiltroFunil {
  /** Vendedores visíveis ao usuário; `null` = todos. */
  responsaveis: string[] | null;
  vendedorId?: string;
  clienteId?: string;
}

/** Porta de leitura do funil (separada da escrita: segregação de interfaces). */
export interface IConsultaFunil {
  listarCards(filtro: FiltroFunil): Promise<CardFunil[]>;
}
