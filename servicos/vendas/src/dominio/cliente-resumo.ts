/** Projeção local do cliente (contexto Clientes), atualizada por eventos. */
export interface ClienteResumo {
  clienteId: string;
  nome: string;
  empresa: string;
  vendedorId: string;
  excluido: boolean;
  versao: number;
}
