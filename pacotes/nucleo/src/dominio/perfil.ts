export const Perfil = {
  ADMINISTRADOR: "ADMINISTRADOR",
  GERENTE: "GERENTE",
  VENDEDOR: "VENDEDOR",
} as const;

export type Perfil = (typeof Perfil)[keyof typeof Perfil];

export const PERFIS: readonly Perfil[] = Object.values(Perfil);
