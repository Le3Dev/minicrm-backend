import { TAMANHO_PAGINA } from "@minicrm/nucleo/dominio";
import { ETAPAS, type EtapaFunil } from "./etapa-funil";
import { Dinheiro } from "./dinheiro";

export interface CardFunil {
  id: string;
  titulo: string;
  clienteId: string;
  clienteNome: string;
  vendedorId: string;
  valorEstimado: number;
  dataPrevista: string;
  etapa: EtapaFunil;
}

export interface ColunaFunil {
  etapa: EtapaFunil;
  quantidade: number;
  valorTotal: number;
  cards: CardFunil[];
  maisItens: boolean;
}

/** Agrupa os cards por etapa com totais (RF08). Cada coluna exibe até 20 cards. */
export function montarFunil(cards: readonly CardFunil[]): ColunaFunil[] {
  return ETAPAS.map((etapa) => {
    const daEtapa = cards
      .filter((c) => c.etapa === etapa)
      .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));
    const total = daEtapa.reduce((soma, c) => soma.somar(Dinheiro.de(c.valorEstimado)), Dinheiro.ZERO);
    return {
      etapa,
      quantidade: daEtapa.length,
      valorTotal: total.valor,
      cards: daEtapa.slice(0, TAMANHO_PAGINA),
      maisItens: daEtapa.length > TAMANHO_PAGINA,
    };
  });
}
