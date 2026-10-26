import { z } from "zod";
import { ValidadorZod } from "@minicrm/nucleo/aplicacao";
import type { ReabrirOportunidadeEntrada } from "./reabrir-oportunidade.comando";

const esquema = z.object({ oportunidadeId: z.string().uuid() });

export class ReabrirOportunidadeValidador extends ValidadorZod<ReabrirOportunidadeEntrada> {
  constructor() {
    super(esquema);
  }
}
