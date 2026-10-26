import { parametrosIn, type BancoSql, type ParametrosSql } from "@minicrm/infra-azure";
import type { CardFunil } from "../../dominio/funil";
import type { EtapaFunil } from "../../dominio/etapa-funil";
import type { FiltroFunil, IConsultaFunil } from "../../aplicacao/portas";

interface LinhaCard {
  id: string;
  titulo: string;
  cliente_id: string;
  cliente_nome: string | null;
  vendedor_id: string;
  valor_estimado: number;
  data_prevista: Date;
  etapa: EtapaFunil;
}

/** Leitura do funil: junta a oportunidade com a projeção local do cliente. */
export class ConsultaFunilSql implements IConsultaFunil {
  constructor(private readonly banco: BancoSql) {}

  async listarCards(filtro: FiltroFunil): Promise<CardFunil[]> {
    const condicoes: string[] = ["1 = 1"];
    let parametros: ParametrosSql = {};
    if (filtro.responsaveis !== null) {
      if (filtro.responsaveis.length === 0) return [];
      const lista = parametrosIn("r", filtro.responsaveis);
      condicoes.push(`o.vendedor_id IN (${lista.lista})`);
      parametros = { ...parametros, ...lista.parametros };
    }
    if (filtro.vendedorId) {
      condicoes.push("o.vendedor_id = @vendedor");
      parametros["vendedor"] = filtro.vendedorId;
    }
    if (filtro.clienteId) {
      condicoes.push("o.cliente_id = @cliente");
      parametros["cliente"] = filtro.clienteId;
    }
    const linhas = await this.banco.consultar<LinhaCard>(
      `SELECT o.id, o.titulo, o.cliente_id, c.nome AS cliente_nome, o.vendedor_id, o.valor_estimado, o.data_prevista, o.etapa
       FROM OPORTUNIDADE o LEFT JOIN CLIENTE_RESUMO c ON c.cliente_id = o.cliente_id
       WHERE ${condicoes.join(" AND ")}`,
      parametros,
    );
    return linhas.map((l) => ({
      id: l.id.toLowerCase(),
      titulo: l.titulo,
      clienteId: l.cliente_id.toLowerCase(),
      clienteNome: l.cliente_nome ?? "",
      vendedorId: l.vendedor_id.toLowerCase(),
      valorEstimado: Number(l.valor_estimado),
      dataPrevista: l.data_prevista.toISOString().slice(0, 10),
      etapa: l.etapa,
    }));
  }
}
