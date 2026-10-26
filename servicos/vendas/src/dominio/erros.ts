import { ViolacaoRegraNegocio } from "@minicrm/nucleo/dominio";
import type { EtapaFunil } from "./etapa-funil";

export class TransicaoInvalida extends ViolacaoRegraNegocio {
  constructor(origem: EtapaFunil, destino: EtapaFunil | "REABERTURA", motivo: string) {
    super("TRANSICAO_INVALIDA", `Não é possível passar de ${origem} para ${destino}: ${motivo}`);
  }
}

export class ClienteIndisponivel extends ViolacaoRegraNegocio {
  constructor() {
    super("CLIENTE_INDISPONIVEL", "O cliente foi excluído e não pode receber novas oportunidades.");
  }
}
