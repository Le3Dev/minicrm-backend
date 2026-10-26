import type { UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { EtapaFunil } from "../../dominio/etapa-funil";

export interface MoverEtapaEntrada {
  oportunidadeId: string;
  etapa: EtapaFunil;
}

export interface MoverEtapaComando extends MoverEtapaEntrada {
  usuario: UsuarioAutenticado;
}
