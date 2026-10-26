import { sucesso, type Resultado } from "@minicrm/nucleo/dominio";
import type { EventoRecebido, IManipulador } from "@minicrm/nucleo/aplicacao";
import { EVENTOS_CLIENTE, type DadosCliente } from "@minicrm/contratos/tipos";
import type { IClienteResumoRepositorio } from "../../aplicacao/portas";

/**
 * Consumidor dos eventos de cliente: mantém a projeção ClienteResumo usada nos cards do funil
 * e na validação de novas oportunidades. Eventos antigos (versão menor) são ignorados.
 */
export class ProjetarClienteHandler implements IManipulador<EventoRecebido<DadosCliente>, void> {
  constructor(private readonly clientes: IClienteResumoRepositorio) {}

  async executar(evento: EventoRecebido<DadosCliente>): Promise<Resultado<void>> {
    if (!(EVENTOS_CLIENTE as readonly string[]).includes(evento.tipo) || !("nome" in evento.dados)) {
      return sucesso(undefined);
    }
    const d = evento.dados;
    await this.clientes.salvar({
      clienteId: d.clienteId,
      nome: d.nome,
      empresa: d.empresa,
      vendedorId: d.vendedorId,
      excluido: d.excluido,
      versao: evento.versaoAgregado,
    });
    return sucesso(undefined);
  }
}
