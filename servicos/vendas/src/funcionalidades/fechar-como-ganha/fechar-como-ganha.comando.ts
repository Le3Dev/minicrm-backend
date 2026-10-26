import type { UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";

export interface FecharComoGanhaEntrada {
  oportunidadeId: string;
}

export interface FecharComoGanhaComando extends FecharComoGanhaEntrada {
  usuario: UsuarioAutenticado;
}
