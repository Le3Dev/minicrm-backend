import type { BancoSql } from "@minicrm/infra-azure";
import type { ClienteResumo } from "../../dominio/cliente-resumo";
import type { IClienteResumoRepositorio } from "../../aplicacao/portas";

interface LinhaClienteResumo {
  cliente_id: string;
  nome: string;
  empresa: string;
  vendedor_id: string;
  excluido: boolean;
  versao: number;
}

export class ClienteResumoSql implements IClienteResumoRepositorio {
  constructor(private readonly banco: BancoSql) {}

  async obter(clienteId: string): Promise<ClienteResumo | null> {
    const [l] = await this.banco.consultar<LinhaClienteResumo>(
      "SELECT cliente_id, nome, empresa, vendedor_id, excluido, versao FROM CLIENTE_RESUMO WHERE cliente_id = @id",
      { id: clienteId },
    );
    return l
      ? {
          clienteId: l.cliente_id.toLowerCase(),
          nome: l.nome,
          empresa: l.empresa,
          vendedorId: l.vendedor_id.toLowerCase(),
          excluido: Boolean(l.excluido),
          versao: l.versao,
        }
      : null;
  }

  /** Grava só se a versão recebida não for mais antiga que a já projetada (eventos fora de ordem). */
  async salvar(r: ClienteResumo): Promise<void> {
    await this.banco.executar(
      `MERGE CLIENTE_RESUMO AS alvo
       USING (SELECT @id AS cliente_id) AS origem ON alvo.cliente_id = origem.cliente_id
       WHEN MATCHED AND alvo.versao <= @versao THEN
         UPDATE SET nome = @nome, empresa = @empresa, vendedor_id = @vendedor, excluido = @excluido, versao = @versao
       WHEN NOT MATCHED THEN
         INSERT (cliente_id, nome, empresa, vendedor_id, excluido, versao)
         VALUES (@id, @nome, @empresa, @vendedor, @excluido, @versao);`,
      { id: r.clienteId, nome: r.nome, empresa: r.empresa, vendedor: r.vendedorId, excluido: r.excluido, versao: r.versao },
    );
  }
}
