import { DataCalendario, ErroValidacao, RaizAgregado } from "@minicrm/nucleo/dominio";
import type { DadosOportunidade } from "@minicrm/contratos/tipos";
import { Dinheiro } from "./dinheiro";
import { EtapaFunil, estaAberta, ETAPAS_ABERTAS } from "./etapa-funil";
import type { MotivoPerda } from "./motivo-perda";
import { TransicaoInvalida } from "./erros";
import {
  OportunidadeCriada,
  OportunidadeGanha,
  OportunidadeMovida,
  OportunidadePerdida,
  OportunidadeReaberta,
} from "./eventos";

export interface EstadoOportunidade {
  id: string;
  clienteId: string;
  vendedorId: string;
  titulo: string;
  valorEstimado: Dinheiro;
  dataPrevista: DataCalendario;
  etapa: EtapaFunil;
  motivoPerda: MotivoPerda | null;
  fechadaEm: Date | null;
  criadaEm: Date;
}

/** Registro de mudança de etapa, gravado na tabela HISTORICO_ETAPA. */
export interface TransicaoEtapa {
  origem: EtapaFunil | null;
  destino: EtapaFunil;
  por: string;
  ocorridoEm: Date;
}

export interface NovaOportunidade {
  clienteId: string;
  vendedorId: string;
  titulo: string;
  valorEstimado: number;
  dataPrevista: string;
  por: string;
}

/** Raiz de agregado do contexto Vendas: uma possível venda percorrendo o funil. */
export class Oportunidade extends RaizAgregado {
  private transicoes: TransicaoEtapa[] = [];

  private constructor(
    private estado: EstadoOportunidade,
    versao: number,
  ) {
    super(estado.id, versao);
  }

  static criar(dados: NovaOportunidade, agora: Date): Oportunidade {
    const titulo = dados.titulo.trim();
    if (titulo.length < 3 || titulo.length > 120) throw new ErroValidacao("O título deve ter entre 3 e 120 caracteres.");
    const oportunidade = new Oportunidade(
      {
        id: globalThis.crypto.randomUUID(),
        clienteId: dados.clienteId,
        vendedorId: dados.vendedorId,
        titulo,
        valorEstimado: Dinheiro.de(dados.valorEstimado),
        dataPrevista: DataCalendario.de(dados.dataPrevista),
        etapa: EtapaFunil.PROSPECCAO,
        motivoPerda: null,
        fechadaEm: null,
        criadaEm: agora,
      },
      0,
    );
    oportunidade.transicoes.push({ origem: null, destino: EtapaFunil.PROSPECCAO, por: dados.por, ocorridoEm: agora });
    oportunidade.registrar(new OportunidadeCriada(oportunidade.contrato(dados.por), oportunidade.proximaVersao, agora));
    return oportunidade;
  }

  static reconstituir(estado: EstadoOportunidade, versao: number): Oportunidade {
    return new Oportunidade(estado, versao);
  }

  get clienteId(): string {
    return this.estado.clienteId;
  }
  get vendedorId(): string {
    return this.estado.vendedorId;
  }
  get titulo(): string {
    return this.estado.titulo;
  }
  get valorEstimado(): Dinheiro {
    return this.estado.valorEstimado;
  }
  get dataPrevista(): DataCalendario {
    return this.estado.dataPrevista;
  }
  get etapa(): EtapaFunil {
    return this.estado.etapa;
  }
  get motivoPerda(): MotivoPerda | null {
    return this.estado.motivoPerda;
  }
  get fechadaEm(): Date | null {
    return this.estado.fechadaEm;
  }
  get criadaEm(): Date {
    return this.estado.criadaEm;
  }

  /** Move entre as etapas abertas (RF08). Para fechar, use fecharComoGanha ou fecharComoPerdida. */
  moverPara(destino: EtapaFunil, por: string, agora: Date): void {
    if (!ETAPAS_ABERTAS.includes(destino)) {
      throw new TransicaoInvalida(this.etapa, destino, "o fechamento exige ação própria (ganha ou perdida).");
    }
    this.garantirTransicao(destino);
    const origem = this.etapa;
    this.mudarEtapa(destino, por, agora);
    this.registrar(new OportunidadeMovida({ ...this.contrato(por), etapaOrigem: origem }, this.proximaVersao, agora));
  }

  fecharComoGanha(por: string, agora: Date): void {
    this.garantirTransicao(EtapaFunil.FECHADO_GANHO);
    this.mudarEtapa(EtapaFunil.FECHADO_GANHO, por, agora);
    this.estado.fechadaEm = agora;
    this.registrar(new OportunidadeGanha(this.contrato(por), this.proximaVersao, agora));
  }

  /** Fecha como perdida com motivo obrigatório (RF09, RF29). */
  fecharComoPerdida(motivo: MotivoPerda, por: string, agora: Date): void {
    this.garantirTransicao(EtapaFunil.FECHADO_PERDIDO);
    this.mudarEtapa(EtapaFunil.FECHADO_PERDIDO, por, agora);
    this.estado.motivoPerda = motivo;
    this.estado.fechadaEm = agora;
    this.registrar(new OportunidadePerdida(this.contrato(por), this.proximaVersao, agora));
  }

  /** Reabertura explícita de oportunidade fechada; volta para Proposta (RF19). */
  reabrir(por: string, agora: Date): void {
    if (estaAberta(this.etapa)) throw new TransicaoInvalida(this.etapa, "REABERTURA", "a oportunidade já está aberta.");
    const anterior = this.etapa;
    this.mudarEtapa(EtapaFunil.PROPOSTA, por, agora);
    this.estado.motivoPerda = null;
    this.estado.fechadaEm = null;
    this.registrar(new OportunidadeReaberta({ ...this.contrato(por), etapaAnterior: anterior }, this.proximaVersao, agora));
  }

  /** Cópia do estado, usada pelos repositórios para gravar o agregado. */
  estadoAtual(): Readonly<EstadoOportunidade> {
    return { ...this.estado };
  }

  /** Mudanças de etapa ainda não gravadas no histórico. */
  extrairTransicoes(): TransicaoEtapa[] {
    const pendentes = this.transicoes;
    this.transicoes = [];
    return pendentes;
  }

  private garantirTransicao(destino: EtapaFunil): void {
    if (!estaAberta(this.etapa)) {
      throw new TransicaoInvalida(this.etapa, destino, "a oportunidade está fechada; reabra-a antes.");
    }
    if (this.etapa === destino) throw new TransicaoInvalida(this.etapa, destino, "a oportunidade já está nessa etapa.");
  }

  private mudarEtapa(destino: EtapaFunil, por: string, agora: Date): void {
    this.transicoes.push({ origem: this.etapa, destino, por, ocorridoEm: agora });
    this.estado.etapa = destino;
  }

  /** Dados publicados nos eventos (contrato de integração). */
  contrato(por: string): DadosOportunidade {
    const e = this.estado;
    return {
      oportunidadeId: e.id,
      clienteId: e.clienteId,
      vendedorId: e.vendedorId,
      titulo: e.titulo,
      valorEstimado: e.valorEstimado.valor,
      dataPrevista: e.dataPrevista.iso,
      etapa: e.etapa,
      motivoPerda: e.motivoPerda,
      fechadaEm: e.fechadaEm?.toISOString() ?? null,
      por,
    };
  }
}
