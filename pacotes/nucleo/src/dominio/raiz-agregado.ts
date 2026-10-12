import type { EventoDeDominio } from "./evento-dominio";

/**
 * Base das raízes de agregado: controla a versão (concorrência otimista)
 * e acumula os eventos gerados até que a aplicação os extraia.
 */
export abstract class RaizAgregado {
  private eventosPendentes: EventoDeDominio[] = [];

  protected constructor(
    readonly id: string,
    private versaoAtual: number,
  ) {}

  /** Versão lida do banco; usada para detectar gravações concorrentes. */
  get versao(): number {
    return this.versaoAtual;
  }

  /** Versão que será gravada se houver alterações pendentes. */
  get proximaVersao(): number {
    return this.versaoAtual + 1;
  }

  protected registrar(evento: EventoDeDominio): void {
    this.eventosPendentes.push(evento);
  }

  get possuiAlteracoes(): boolean {
    return this.eventosPendentes.length > 0;
  }

  extrairEventos(): EventoDeDominio[] {
    const eventos = this.eventosPendentes;
    this.eventosPendentes = [];
    return eventos;
  }

  /** Chamado pelo repositório depois de gravar com sucesso. */
  confirmarGravacao(): void {
    this.versaoAtual += 1;
  }
}
