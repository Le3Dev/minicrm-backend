import { app } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { QueueClient } from "@azure/storage-queue";
import type { IManipulador } from "@minicrm/nucleo/aplicacao";

/** Fila de comandos assíncronos (e-mail, relatórios, reenvio da outbox). */
export interface IFila<T> {
  enviar(mensagem: T, opcoes?: { ttlSegundos?: number }): Promise<void>;
}

export class FilaArmazenamento<T> implements IFila<T> {
  private readonly cliente: QueueClient;

  constructor(urlServicoFilas: string, nomeFila: string) {
    this.cliente = new QueueClient(`${urlServicoFilas.replace(/\/$/, "")}/${nomeFila}`, new DefaultAzureCredential());
  }

  async enviar(mensagem: T, opcoes: { ttlSegundos?: number } = {}): Promise<void> {
    const texto = Buffer.from(JSON.stringify(mensagem), "utf8").toString("base64");
    await this.cliente.sendMessage(texto, { messageTimeToLive: opcoes.ttlSegundos });
  }
}

export class FilaEmMemoria<T> implements IFila<T> {
  readonly mensagens: T[] = [];
  constructor(private readonly aoReceber?: (mensagem: T) => Promise<void>) {}
  async enviar(mensagem: T): Promise<void> {
    this.mensagens.push(mensagem);
    await this.aoReceber?.(mensagem);
  }
}

/** Registra um consumidor de fila. Falhas são relançadas para nova tentativa e, depois, fila poison. */
export function registrarConsumidorFila<T>(nome: string, nomeFila: string, fabrica: () => IManipulador<T, void>): void {
  let consumidor: IManipulador<T, void> | undefined;
  app.storageQueue(nome, {
    queueName: nomeFila,
    connection: "ArmazenamentoFilas",
    handler: async (mensagem) => {
      const resultado = await (consumidor ??= fabrica()).executar(mensagem as T);
      if (!resultado.ok) throw new Error(resultado.erro.message);
    },
  });
}

export function registrarTimer(nome: string, cron: string, tarefa: () => Promise<void>): void {
  app.timer(nome, { schedule: cron, handler: () => tarefa() });
}
