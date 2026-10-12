import type { IPublicadorEventos } from "@minicrm/nucleo/aplicacao";
import type { EventoDeDominio } from "@minicrm/nucleo/dominio";
import type { ICanalEventos } from "../eventos/canal-eventos";
import type { IFila } from "../filas/fila-armazenamento";
import { type BancoSql, parametrosIn } from "./banco-sql";

export interface MensagemReenvioOutbox {
  ids: string[];
}

interface LinhaOutbox {
  id: string;
  tipo: string;
  assunto: string;
  versao: number;
  ocorrido_em: Date;
  payload: string;
}

/**
 * Publicador transacional (padrão Outbox): grava o evento na mesma transação do agregado
 * e só o envia ao Event Grid depois do commit.
 */
export class PublicadorOutboxSql implements IPublicadorEventos {
  constructor(
    private readonly banco: BancoSql,
    private readonly despachante: DespachanteOutbox,
  ) {}

  async registrar(eventos: readonly EventoDeDominio[]): Promise<void> {
    if (eventos.length === 0) return;
    for (const e of eventos) {
      await this.banco.executar(
        `INSERT INTO OUTBOX (id, tipo, assunto, versao, ocorrido_em, payload)
         VALUES (@id, @tipo, @assunto, @versao, @ocorrido, @payload)`,
        {
          id: e.id,
          tipo: e.tipo,
          assunto: e.assunto,
          versao: e.versaoAgregado,
          ocorrido: e.ocorridoEm,
          payload: JSON.stringify(e.dados),
        },
      );
    }
    const ids = eventos.map((e) => e.id);
    await this.banco.aposCommit(() => this.despachante.despacharOuAgendar(ids));
  }
}

export class DespachanteOutbox {
  constructor(
    private readonly banco: BancoSql,
    private readonly canal: ICanalEventos,
    private readonly filaReenvio: IFila<MensagemReenvioOutbox>,
  ) {}

  /** Publica os eventos ainda pendentes e marca como publicados. */
  async despachar(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    const { lista, parametros } = parametrosIn("id", ids);
    const linhas = await this.banco.consultar<LinhaOutbox>(
      `SELECT id, tipo, assunto, versao, ocorrido_em, payload FROM OUTBOX
       WHERE id IN (${lista}) AND publicado_em IS NULL ORDER BY ocorrido_em`,
      parametros,
    );
    if (linhas.length === 0) return;
    await this.canal.publicar(
      linhas.map((l) => ({
        id: l.id,
        tipo: l.tipo,
        assunto: l.assunto,
        versaoAgregado: l.versao,
        ocorridoEm: l.ocorrido_em,
        dados: JSON.parse(l.payload) as unknown,
      })),
    );
    const publicados = parametrosIn("p", linhas.map((l) => l.id));
    await this.banco.executar(
      `UPDATE OUTBOX SET publicado_em = SYSUTCDATETIME() WHERE id IN (${publicados.lista})`,
      publicados.parametros,
    );
  }

  /** Tenta publicar logo após o commit; se falhar, agenda nova tentativa pela fila de reenvio. */
  async despacharOuAgendar(ids: readonly string[]): Promise<void> {
    try {
      await this.despachar(ids);
    } catch (erro) {
      console.warn("Publicação imediata falhou; agendando reenvio da outbox.", erro);
      await this.filaReenvio.enviar({ ids: [...ids] });
    }
  }
}

/** Consumidor da fila de reenvio: nova tentativa de publicar eventos que falharam após o commit. */
export class ReenvioOutbox {
  constructor(private readonly despachante: DespachanteOutbox) {}
  async executar(mensagem: MensagemReenvioOutbox): Promise<{ ok: true; valor: undefined }> {
    await this.despachante.despachar(mensagem.ids);
    return { ok: true, valor: undefined };
  }
}
