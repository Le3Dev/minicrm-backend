import { z } from "zod";
import { ValidadorZod } from "@minicrm/nucleo/aplicacao";
import { MotivoPerda } from "../../dominio/motivo-perda";
import type { FecharComoPerdidaEntrada } from "./fechar-como-perdida.comando";

const esquema = z.object({
  oportunidadeId: z.string().uuid(),
  motivo: z.enum(MotivoPerda, { message: "Informe o motivo da perda: PRECO, CONCORRENTE, SEM_VERBA ou SEM_RESPOSTA." }),
});

export class FecharComoPerdidaValidador extends ValidadorZod<FecharComoPerdidaEntrada> {
  constructor() {
    super(esquema);
  }
}
