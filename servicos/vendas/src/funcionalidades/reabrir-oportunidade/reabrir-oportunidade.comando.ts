import type { UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";

export interface ReabrirOportunidadeEntrada {
  oportunidadeId: string;
}

export interface ReabrirOportunidadeComando extends ReabrirOportunidadeEntrada {
  usuario: UsuarioAutenticado;
}
