import type { EventoDeDominio } from "../dominio/evento-dominio";
import type { Resultado } from "../dominio/resultado";
import { sucesso } from "../dominio/resultado";
import type { IManipulador } from "./manipulador";
import type { IRegistroEventosProcessados, IUnidadeDeTrabalho } from "./portas";

/** Evento vindo de outro contexto, já convertido do CloudEvent pelo adaptador. */
export type EventoRecebido<T = unknown> = EventoDeDominio<T>;

/**
 * Decorador que torna um consumidor de eventos idempotente: reentregas do mesmo
 * evento são ignoradas. O consumidor original não precisa saber disso (aberto/fechado).
 */
export class ConsumidorIdempotente<T> implements IManipulador<EventoRecebido<T>, void> {
  constructor(
    private readonly consumidor: IManipulador<EventoRecebido<T>, void>,
    private readonly registro: IRegistroEventosProcessados,
    private readonly uow: IUnidadeDeTrabalho,
  ) {}

  executar(evento: EventoRecebido<T>): Promise<Resultado<void>> {
    return this.uow.executar(async () => {
      if (await this.registro.jaProcessado(evento.id)) return sucesso(undefined);
      const resultado = await this.consumidor.executar(evento);
      if (resultado.ok) await this.registro.marcar(evento.id, evento.tipo);
      return resultado;
    });
  }
}
