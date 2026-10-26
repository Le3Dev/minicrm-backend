import { ConflitoConcorrencia } from "@minicrm/nucleo/dominio";
import type { ClienteResumo } from "../../dominio/cliente-resumo";
import type { CardFunil } from "../../dominio/funil";
import { Oportunidade, type EstadoOportunidade, type TransicaoEtapa } from "../../dominio/oportunidade";
import type {
  FiltroFunil,
  IClienteResumoRepositorio,
  IConsultaFunil,
  IOportunidadeRepositorio,
} from "../../aplicacao/portas";

/** Adaptadores em memória: usados nos testes das fatias e no modo local (MODO_ADAPTADORES=memoria). */
export class OportunidadeRepositorioEmMemoria implements IOportunidadeRepositorio {
  readonly registros = new Map<string, { estado: EstadoOportunidade; versao: number }>();
  readonly historico: Array<TransicaoEtapa & { oportunidadeId: string }> = [];

  async obterPorId(id: string): Promise<Oportunidade | null> {
    const registro = this.registros.get(id);
    return registro ? Oportunidade.reconstituir({ ...registro.estado }, registro.versao) : null;
  }

  async salvar(oportunidade: Oportunidade): Promise<void> {
    const versaoGravada = this.registros.get(oportunidade.id)?.versao ?? 0;
    if (versaoGravada !== oportunidade.versao) throw new ConflitoConcorrencia("Oportunidade");
    this.registros.set(oportunidade.id, { estado: oportunidade.estadoAtual(), versao: oportunidade.proximaVersao });
    for (const t of oportunidade.extrairTransicoes()) this.historico.push({ ...t, oportunidadeId: oportunidade.id });
    oportunidade.confirmarGravacao();
  }
}

export class ClienteResumoEmMemoria implements IClienteResumoRepositorio {
  readonly registros = new Map<string, ClienteResumo>();

  async obter(clienteId: string): Promise<ClienteResumo | null> {
    return this.registros.get(clienteId) ?? null;
  }

  async salvar(resumo: ClienteResumo): Promise<void> {
    const atual = this.registros.get(resumo.clienteId);
    if (atual && atual.versao > resumo.versao) return;
    this.registros.set(resumo.clienteId, resumo);
  }
}

export class ConsultaFunilEmMemoria implements IConsultaFunil {
  constructor(
    private readonly oportunidades: OportunidadeRepositorioEmMemoria,
    private readonly clientes: ClienteResumoEmMemoria,
  ) {}

  async listarCards(filtro: FiltroFunil): Promise<CardFunil[]> {
    return [...this.oportunidades.registros.values()]
      .map((r) => r.estado)
      .filter((e) => filtro.responsaveis === null || filtro.responsaveis.includes(e.vendedorId))
      .filter((e) => !filtro.vendedorId || e.vendedorId === filtro.vendedorId)
      .filter((e) => !filtro.clienteId || e.clienteId === filtro.clienteId)
      .map((e) => ({
        id: e.id,
        titulo: e.titulo,
        clienteId: e.clienteId,
        clienteNome: this.clientes.registros.get(e.clienteId)?.nome ?? "",
        vendedorId: e.vendedorId,
        valorEstimado: e.valorEstimado.valor,
        dataPrevista: e.dataPrevista.iso,
        etapa: e.etapa,
      }));
  }
}
