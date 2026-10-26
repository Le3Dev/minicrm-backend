import { z } from "zod";
import { ValidadorZod } from "@minicrm/nucleo/aplicacao";
import type { FecharComoGanhaEntrada } from "./fechar-como-ganha.comando";

const esquema = z.object({ oportunidadeId: z.string().uuid() });

export class FecharComoGanhaValidador extends ValidadorZod<FecharComoGanhaEntrada> {
  constructor() {
    super(esquema);
  }
}
