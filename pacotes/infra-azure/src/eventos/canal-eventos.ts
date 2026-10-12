import { EventGridPublisherClient } from "@azure/eventgrid";
import { DefaultAzureCredential } from "@azure/identity";
import type { EventoDeDominio } from "@minicrm/nucleo/dominio";
import { paraCloudEvent } from "./cloud-event";

/** Destino final dos eventos já gravados na outbox. */
export interface ICanalEventos {
  publicar(eventos: readonly EventoDeDominio[]): Promise<void>;
}

export class CanalEventGrid implements ICanalEventos {
  private readonly cliente: EventGridPublisherClient<"CloudEvent">;

  constructor(
    endpoint: string,
    private readonly origem: string,
  ) {
    this.cliente = new EventGridPublisherClient(endpoint, "CloudEvent", new DefaultAzureCredential());
  }

  async publicar(eventos: readonly EventoDeDominio[]): Promise<void> {
    if (eventos.length === 0) return;
    await this.cliente.send(eventos.map((e) => paraCloudEvent(e, this.origem)));
  }
}

/** Modo local: apenas registra no log; os serviços rodam isolados. */
export class CanalEventosLog implements ICanalEventos {
  constructor(private readonly origem: string) {}
  async publicar(eventos: readonly EventoDeDominio[]): Promise<void> {
    for (const e of eventos) console.info(`[evento ${this.origem}] ${e.tipo} ${e.assunto}`);
  }
}
