import { z } from "zod";
import { ValidadorZod } from "@minicrm/nucleo/aplicacao";
import type { CriarOportunidadeEntrada } from "./criar-oportunidade.comando";

const esquema = z.object({
  clienteId: z.string().uuid(),
  titulo: z.string().trim().min(3).max(120),
  valorEstimado: z.number().nonnegative(),
  dataPrevista: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD."),
  vendedorId: z.string().uuid().optional(),
});

export class CriarOportunidadeValidador extends ValidadorZod<CriarOportunidadeEntrada> {
  constructor() {
    super(esquema);
  }
}
