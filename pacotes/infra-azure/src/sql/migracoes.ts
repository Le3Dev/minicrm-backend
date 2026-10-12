import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { BancoSql } from "./banco-sql";

/**
 * Aplica, em ordem, os scripts .sql da pasta `migracoes` que ainda não foram executados.
 * Cada script pode ter vários lotes separados por linhas contendo apenas `GO`.
 */
export async function aplicarMigracoes(banco: BancoSql, pasta: string): Promise<string[]> {
  await banco.executar(`IF OBJECT_ID('MIGRACAO') IS NULL
    CREATE TABLE MIGRACAO (nome NVARCHAR(200) PRIMARY KEY, aplicada_em DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME())`);
  const aplicadas = new Set(
    (await banco.consultar<{ nome: string }>("SELECT nome FROM MIGRACAO")).map((l) => l.nome),
  );
  const arquivos = (await readdir(pasta)).filter((a) => a.endsWith(".sql")).sort();
  const novas: string[] = [];
  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;
    const conteudo = await readFile(join(pasta, arquivo), "utf8");
    await banco.transacao(async () => {
      for (const lote of conteudo.split(/^\s*GO\s*$/im).filter((l) => l.trim())) await banco.executar(lote);
      await banco.executar("INSERT INTO MIGRACAO (nome) VALUES (@nome)", { nome: arquivo });
    });
    novas.push(arquivo);
  }
  return novas;
}
