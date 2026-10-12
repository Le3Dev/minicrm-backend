/**
 * Evento de domínio: fato que já aconteceu dentro de um contexto.
 * É serializado como CloudEvent pelo adaptador de publicação.
 */
export interface EventoDeDominio<T = unknown> {
  readonly id: string;
  readonly tipo: string;
  readonly assunto: string;
  readonly ocorridoEm: Date;
  readonly versaoAgregado: number;
  readonly dados: T;
}

export abstract class EventoBase<T> implements EventoDeDominio<T> {
  readonly id: string;

  protected constructor(
    readonly tipo: string,
    readonly assunto: string,
    readonly versaoAgregado: number,
    readonly dados: T,
    readonly ocorridoEm: Date,
  ) {
    this.id = globalThis.crypto.randomUUID();
  }
}
