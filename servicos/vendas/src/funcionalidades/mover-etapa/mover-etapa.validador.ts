import { z } from "zod";
import { ValidadorZod } from "@minicrm/nucleo/aplicacao";
import { EtapaFunil } from "../../dominio/etapa-funil";
import type { MoverEtapaEntrada } from "./mover-etapa.comando";

const esquema = z.object({
  oportunidadeId: z.string().uuid(),
  etapa: z.enum(EtapaFunil),
});

export class MoverEtapaValidador extends ValidadorZod<MoverEtapaEntrada> {
  constructor() {
    super(esquema);
  }
}
