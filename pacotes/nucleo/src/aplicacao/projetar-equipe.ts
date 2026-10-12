import type { Perfil } from "../dominio/perfil";
import { sucesso, type Resultado } from "../dominio/resultado";
import type { IManipulador } from "./manipulador";
import type { EventoRecebido } from "./evento-recebido";
import type { IEquipeProjecao } from "./portas";

export interface DadosUsuarioEvento {
  usuarioId: string;
  nome: string;
  perfil: Perfil;
  gerenteId: string | null;
  ativo: boolean;
}

/**
 * Base dos consumidores que mantêm a projeção de equipe. Clientes, Vendas e Tarefas
 * têm cada um a sua fatia `projetar-equipe`, que estende esta classe.
 */
export abstract class ProjetarEquipeBase implements IManipulador<EventoRecebido<DadosUsuarioEvento>, void> {
  protected constructor(private readonly equipe: IEquipeProjecao) {}

  async executar(evento: EventoRecebido<DadosUsuarioEvento>): Promise<Resultado<void>> {
    const { usuarioId, nome, perfil, gerenteId, ativo } = evento.dados;
    await this.equipe.salvar({ usuarioId, nome, perfil, gerenteId, ativo });
    return sucesso(undefined);
  }
}
