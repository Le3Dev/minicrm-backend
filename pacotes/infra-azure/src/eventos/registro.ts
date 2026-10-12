import { app } from "@azure/functions";
import type { EventoRecebido, IManipulador } from "@minicrm/nucleo/aplicacao";
import { deCloudEvent } from "./cloud-event";

/**
 * Registra um consumidor de eventos (gatilho Event Grid). Falhas de regra são registradas
 * e descartadas; exceções inesperadas são relançadas para que o Event Grid tente de novo
 * e, esgotadas as tentativas, envie o evento para o dead-letter.
 */
export function registrarConsumidor(nome: string, fabrica: () => IManipulador<EventoRecebido, void>): void {
  let consumidor: IManipulador<EventoRecebido, void> | undefined;
  app.eventGrid(nome, {
    handler: async (bruto, ctx) => {
      const evento = deCloudEvent(bruto);
      const resultado = await (consumidor ??= fabrica()).executar(evento);
      if (!resultado.ok) ctx.warn(`Evento ${evento.id} (${evento.tipo}) ignorado: ${resultado.erro.message}`);
    },
  });
}
