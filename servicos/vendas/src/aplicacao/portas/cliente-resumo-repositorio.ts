import type { ClienteResumo } from "../../dominio/cliente-resumo";

export interface IClienteResumoRepositorio {
  obter(clienteId: string): Promise<ClienteResumo | null>;
  salvar(resumo: ClienteResumo): Promise<void>;
}
