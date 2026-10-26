export const EtapaFunil = {
  PROSPECCAO: "PROSPECCAO",
  CONTATO: "CONTATO",
  PROPOSTA: "PROPOSTA",
  FECHADO_GANHO: "FECHADO_GANHO",
  FECHADO_PERDIDO: "FECHADO_PERDIDO",
} as const;

export type EtapaFunil = (typeof EtapaFunil)[keyof typeof EtapaFunil];

/** Ordem de exibição das colunas do funil. */
export const ETAPAS: readonly EtapaFunil[] = Object.values(EtapaFunil);

export const ETAPAS_ABERTAS: readonly EtapaFunil[] = [EtapaFunil.PROSPECCAO, EtapaFunil.CONTATO, EtapaFunil.PROPOSTA];

export const estaAberta = (etapa: EtapaFunil): boolean => ETAPAS_ABERTAS.includes(etapa);
