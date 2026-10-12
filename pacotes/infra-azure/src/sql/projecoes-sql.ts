import type { IEquipeProjecao, IRegistroEventosProcessados, MembroEquipe } from "@minicrm/nucleo/aplicacao";
import type { Perfil } from "@minicrm/nucleo/dominio";
import type { BancoSql } from "./banco-sql";

interface LinhaEquipe {
  usuario_id: string;
  nome: string;
  perfil: Perfil;
  gerente_id: string | null;
  ativo: boolean;
}

const paraMembro = (l: LinhaEquipe): MembroEquipe => ({
  usuarioId: l.usuario_id,
  nome: l.nome,
  perfil: l.perfil,
  gerenteId: l.gerente_id,
  ativo: Boolean(l.ativo),
});

/** Tabela EQUIPE_PROJECAO, presente nos bancos que aplicam a regra de visibilidade. */
export class EquipeProjecaoSql implements IEquipeProjecao {
  constructor(private readonly banco: BancoSql) {}

  async obter(usuarioId: string): Promise<MembroEquipe | null> {
    const [linha] = await this.banco.consultar<LinhaEquipe>(
      "SELECT usuario_id, nome, perfil, gerente_id, ativo FROM EQUIPE_PROJECAO WHERE usuario_id = @id",
      { id: usuarioId },
    );
    return linha ? paraMembro(linha) : null;
  }

  async listarVendedoresDe(gerenteId: string): Promise<MembroEquipe[]> {
    const linhas = await this.banco.consultar<LinhaEquipe>(
      "SELECT usuario_id, nome, perfil, gerente_id, ativo FROM EQUIPE_PROJECAO WHERE gerente_id = @gerente",
      { gerente: gerenteId },
    );
    return linhas.map(paraMembro);
  }

  async salvar(m: MembroEquipe): Promise<void> {
    await this.banco.executar(
      `MERGE EQUIPE_PROJECAO AS alvo
       USING (SELECT @id AS usuario_id) AS origem ON alvo.usuario_id = origem.usuario_id
       WHEN MATCHED THEN UPDATE SET nome = @nome, perfil = @perfil, gerente_id = @gerente, ativo = @ativo
       WHEN NOT MATCHED THEN INSERT (usuario_id, nome, perfil, gerente_id, ativo)
         VALUES (@id, @nome, @perfil, @gerente, @ativo);`,
      { id: m.usuarioId, nome: m.nome, perfil: m.perfil, gerente: m.gerenteId, ativo: m.ativo },
    );
  }
}

/** Tabela EVENTO_PROCESSADO: garante consumo idempotente. */
export class EventosProcessadosSql implements IRegistroEventosProcessados {
  constructor(private readonly banco: BancoSql) {}

  async jaProcessado(eventoId: string): Promise<boolean> {
    const linhas = await this.banco.consultar("SELECT 1 AS x FROM EVENTO_PROCESSADO WHERE evento_id = @id", {
      id: eventoId,
    });
    return linhas.length > 0;
  }

  async marcar(eventoId: string, tipo: string): Promise<void> {
    await this.banco.executar(
      "INSERT INTO EVENTO_PROCESSADO (evento_id, tipo, processado_em) VALUES (@id, @tipo, SYSUTCDATETIME())",
      { id: eventoId, tipo },
    );
  }
}
