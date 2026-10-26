import { ProjetarEquipeBase, type IEquipeProjecao } from "@minicrm/nucleo/aplicacao";

/** Consumidor dos eventos de Identidade: mantém a projeção de equipe usada na visibilidade. */
export class ProjetarEquipeHandler extends ProjetarEquipeBase {
  constructor(equipe: IEquipeProjecao) {
    super(equipe);
  }
}
