export const MotivoPerda = {
  PRECO: "PRECO",
  CONCORRENTE: "CONCORRENTE",
  SEM_VERBA: "SEM_VERBA",
  SEM_RESPOSTA: "SEM_RESPOSTA",
} as const;

export type MotivoPerda = (typeof MotivoPerda)[keyof typeof MotivoPerda];

export const MOTIVOS_PERDA: readonly MotivoPerda[] = Object.values(MotivoPerda);
