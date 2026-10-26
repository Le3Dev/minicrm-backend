import type { UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";

export interface ListarFunilEntrada {
  vendedorId?: string;
  clienteId?: string;
}

export interface ListarFunilConsulta extends ListarFunilEntrada {
  usuario: UsuarioAutenticado;
}
