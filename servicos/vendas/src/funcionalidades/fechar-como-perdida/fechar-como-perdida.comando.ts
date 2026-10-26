import type { UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { MotivoPerda } from "../../dominio/motivo-perda";

export interface FecharComoPerdidaEntrada {
  oportunidadeId: string;
  motivo: MotivoPerda;
}

export interface FecharComoPerdidaComando extends FecharComoPerdidaEntrada {
  usuario: UsuarioAutenticado;
}
