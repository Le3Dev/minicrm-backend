import type { UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";

export interface CriarOportunidadeEntrada {
  clienteId: string;
  titulo: string;
  valorEstimado: number;
  dataPrevista: string;
  /** Gerente e Administrador podem indicar o vendedor; para o Vendedor é sempre ele mesmo. */
  vendedorId?: string;
}

export interface CriarOportunidadeComando extends CriarOportunidadeEntrada {
  usuario: UsuarioAutenticado;
}
