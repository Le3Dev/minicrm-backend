import { EventoBase } from "@minicrm/nucleo/dominio";
import {
  TipoEvento,
  type DadosOportunidade,
  type DadosOportunidadeMovida,
  type DadosOportunidadeReaberta,
} from "@minicrm/contratos/tipos";

const assunto = (id: string) => `oportunidade/${id}`;

export class OportunidadeCriada extends EventoBase<DadosOportunidade> {
  constructor(dados: DadosOportunidade, versao: number, quando: Date) {
    super(TipoEvento.OportunidadeCriada, assunto(dados.oportunidadeId), versao, dados, quando);
  }
}

export class OportunidadeMovida extends EventoBase<DadosOportunidadeMovida> {
  constructor(dados: DadosOportunidadeMovida, versao: number, quando: Date) {
    super(TipoEvento.OportunidadeMovida, assunto(dados.oportunidadeId), versao, dados, quando);
  }
}

export class OportunidadeGanha extends EventoBase<DadosOportunidade> {
  constructor(dados: DadosOportunidade, versao: number, quando: Date) {
    super(TipoEvento.OportunidadeGanha, assunto(dados.oportunidadeId), versao, dados, quando);
  }
}

export class OportunidadePerdida extends EventoBase<DadosOportunidade> {
  constructor(dados: DadosOportunidade, versao: number, quando: Date) {
    super(TipoEvento.OportunidadePerdida, assunto(dados.oportunidadeId), versao, dados, quando);
  }
}

export class OportunidadeReaberta extends EventoBase<DadosOportunidadeReaberta> {
  constructor(dados: DadosOportunidadeReaberta, versao: number, quando: Date) {
    super(TipoEvento.OportunidadeReaberta, assunto(dados.oportunidadeId), versao, dados, quando);
  }
}
