import { Perfil } from "./perfil";

export interface Solicitante {
  readonly id: string;
  readonly perfil: Perfil;
}

/**
 * Regra de visibilidade por vínculo (RF15, RF22, RF25):
 * o Administrador vê tudo, o Gerente vê a própria equipe e o Vendedor vê só o que é dele.
 */
export function podeAcessarRegistroDe(
  solicitante: Solicitante,
  responsavelId: string,
  gerenteDoResponsavel: string | null,
): boolean {
  switch (solicitante.perfil) {
    case Perfil.ADMINISTRADOR:
      return true;
    case Perfil.GERENTE:
      return responsavelId === solicitante.id || gerenteDoResponsavel === solicitante.id;
    case Perfil.VENDEDOR:
      return responsavelId === solicitante.id;
  }
}
