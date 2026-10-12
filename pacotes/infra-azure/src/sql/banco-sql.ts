import { AsyncLocalStorage } from "node:async_hooks";
import sql from "mssql";
import type { IUnidadeDeTrabalho } from "@minicrm/nucleo/aplicacao";

interface EscopoTransacao {
  transacao: sql.Transaction;
  aposCommit: Array<() => Promise<void>>;
}

const escopo = new AsyncLocalStorage<EscopoTransacao>();

export type ParametrosSql = Record<string, unknown>;

/**
 * Acesso ao Azure SQL. Em produção a conexão usa a identidade gerenciada da Function App
 * (sem senha); localmente aceita uma connection string de SQL Server.
 * Se houver uma transação aberta pela unidade de trabalho, os comandos participam dela.
 */
export class BancoSql {
  private pool?: Promise<sql.ConnectionPool>;

  constructor(private readonly configuracao: { connectionString?: string; servidor?: string; banco?: string }) {}

  static doAmbiente(): BancoSql {
    return new BancoSql({
      connectionString: process.env.SQL_CONNECTION_STRING || undefined,
      servidor: process.env.SQL_SERVIDOR || undefined,
      banco: process.env.SQL_BANCO || undefined,
    });
  }

  conexao(): Promise<sql.ConnectionPool> {
    this.pool ??= this.criarPool().connect();
    return this.pool;
  }

  private criarPool(): sql.ConnectionPool {
    const { connectionString, servidor, banco } = this.configuracao;
    if (connectionString) return new sql.ConnectionPool(connectionString);
    if (!servidor || !banco) throw new Error("Configure SQL_CONNECTION_STRING ou SQL_SERVIDOR e SQL_BANCO.");
    return new sql.ConnectionPool({
      server: servidor,
      database: banco,
      options: { encrypt: true },
      authentication: { type: "azure-active-directory-default", options: {} },
      pool: { max: 5, min: 0, idleTimeoutMillis: 30_000 },
    });
  }

  async consultar<T>(texto: string, parametros: ParametrosSql = {}): Promise<T[]> {
    const requisicao = await this.requisicao();
    for (const [nome, valor] of Object.entries(parametros)) requisicao.input(nome, valor);
    const resultado = await requisicao.query<T>(texto);
    return resultado.recordset ?? [];
  }

  async executar(texto: string, parametros: ParametrosSql = {}): Promise<number> {
    const requisicao = await this.requisicao();
    for (const [nome, valor] of Object.entries(parametros)) requisicao.input(nome, valor);
    const resultado = await requisicao.query(texto);
    return resultado.rowsAffected.reduce((a, b) => a + b, 0);
  }

  /** Agenda uma ação para depois do commit da transação atual (ou executa já, se não houver). */
  async aposCommit(acao: () => Promise<void>): Promise<void> {
    const atual = escopo.getStore();
    if (atual) atual.aposCommit.push(acao);
    else await acao();
  }

  private async requisicao(): Promise<sql.Request> {
    const atual = escopo.getStore();
    if (atual) return new sql.Request(atual.transacao);
    return (await this.conexao()).request();
  }

  async transacao<T>(trabalho: () => Promise<T>): Promise<T> {
    if (escopo.getStore()) return trabalho();
    const transacao = new sql.Transaction(await this.conexao());
    await transacao.begin();
    const contexto: EscopoTransacao = { transacao, aposCommit: [] };
    let resultado: T;
    try {
      resultado = await escopo.run(contexto, trabalho);
      await transacao.commit();
    } catch (erro) {
      await transacao.rollback().catch(() => undefined);
      throw erro;
    }
    for (const acao of contexto.aposCommit) {
      await acao().catch((erro) => console.error("Falha em ação pós-commit", erro));
    }
    return resultado;
  }
}

export class UnidadeDeTrabalhoSql implements IUnidadeDeTrabalho {
  constructor(private readonly banco: BancoSql) {}
  executar<T>(trabalho: () => Promise<T>): Promise<T> {
    return this.banco.transacao(trabalho);
  }
}

/** Gera a lista de parâmetros de uma cláusula IN: (@p0, @p1, ...). */
export function parametrosIn(prefixo: string, valores: readonly unknown[]): { lista: string; parametros: ParametrosSql } {
  const parametros: ParametrosSql = {};
  const nomes = valores.map((valor, i) => {
    parametros[`${prefixo}${i}`] = valor;
    return `@${prefixo}${i}`;
  });
  return { lista: nomes.join(", "), parametros };
}
