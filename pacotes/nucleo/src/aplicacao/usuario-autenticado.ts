import type { Perfil } from "../dominio/perfil";

/** Identidade de quem fez a requisição, extraída do JWT pelo adaptador de entrada. */
export interface UsuarioAutenticado {
  readonly id: string;
  readonly nome: string;
  readonly perfil: Perfil;
}
