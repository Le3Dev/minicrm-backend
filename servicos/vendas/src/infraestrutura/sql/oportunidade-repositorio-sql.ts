import { type BancoSql } from "@minicrm/infra-azure";
import { ConflitoConcorrencia, DataCalendario } from "@minicrm/nucleo/dominio";
import { Dinheiro } from "../../dominio/dinheiro";
import type { EtapaFunil } from "../../dominio/etapa-funil";
import type { MotivoPerda } from "../../dominio/motivo-perda";
import { Oportunidade } from "../../dominio/oportunidade";
import type { IOportunidadeRepositorio } from "../../aplicacao/portas";

interface LinhaOportunidade {
  id: string;
  cliente_id: string;
  vendedor_id: string;
  titulo: string;
  valor_estimado: number;
  data_prevista: Date;
  etapa: EtapaFunil;
  motivo_perda: MotivoPerda | null;
  fechada_em: Date | null;
  criada_em: Date;
  versao: number;
}

const COLUNAS = "id, cliente_id, vendedor_id, titulo, valor_estimado, data_prevista, etapa, motivo_perda, fechada_em, criada_em, versao";

/** Adaptador de saída: agregado Oportunidade no Azure SQL (tabelas OPORTUNIDADE e HISTORICO_ETAPA). */
export class OportunidadeRepositorioSql implements IOportunidadeRepositorio {
  constructor(private readonly banco: BancoSql) {}

  async obterPorId(id: string): Promise<Oportunidade | null> {
    const [l] = await this.banco.consultar<LinhaOportunidade>(`SELECT ${COLUNAS} FROM OPORTUNIDADE WHERE id = @id`, { id });
    if (!l) return null;
    return Oportunidade.reconstituir(
      {
        id: l.id.toLowerCase(),
        clienteId: l.cliente_id.toLowerCase(),
        vendedorId: l.vendedor_id.toLowerCase(),
        titulo: l.titulo,
        valorEstimado: Dinheiro.de(Number(l.valor_estimado)),
        dataPrevista: DataCalendario.de(l.data_prevista.toISOString().slice(0, 10)),
        etapa: l.etapa,
        motivoPerda: l.motivo_perda,
        fechadaEm: l.fechada_em,
        criadaEm: l.criada_em,
      },
      l.versao,
    );
  }

  async salvar(o: Oportunidade): Promise<void> {
    const e = o.estadoAtual();
    const parametros = {
      id: e.id,
      cliente: e.clienteId,
      vendedor: e.vendedorId,
      titulo: e.titulo,
      valor: e.valorEstimado.valor,
      prevista: e.dataPrevista.iso,
      etapa: e.etapa,
      motivo: e.motivoPerda,
      fechada: e.fechadaEm,
      criada: e.criadaEm,
      versao: o.versao,
      nova: o.proximaVersao,
    };
    if (o.versao === 0) {
      await this.banco.executar(
        `INSERT INTO OPORTUNIDADE (${COLUNAS})
         VALUES (@id, @cliente, @vendedor, @titulo, @valor, @prevista, @etapa, @motivo, @fechada, @criada, @nova)`,
        parametros,
      );
    } else {
      const alteradas = await this.banco.executar(
        `UPDATE OPORTUNIDADE SET vendedor_id = @vendedor, titulo = @titulo, valor_estimado = @valor,
           data_prevista = @prevista, etapa = @etapa, motivo_perda = @motivo, fechada_em = @fechada, versao = @nova
         WHERE id = @id AND versao = @versao`,
        parametros,
      );
      if (alteradas === 0) throw new ConflitoConcorrencia("Oportunidade");
    }
    for (const t of o.extrairTransicoes()) {
      await this.banco.executar(
        `INSERT INTO HISTORICO_ETAPA (id, oportunidade_id, etapa_origem, etapa_destino, usuario_id, ocorrido_em)
         VALUES (NEWID(), @id, @origem, @destino, @por, @quando)`,
        { id: e.id, origem: t.origem, destino: t.destino, por: t.por, quando: t.ocorridoEm },
      );
    }
    o.confirmarGravacao();
  }
}
