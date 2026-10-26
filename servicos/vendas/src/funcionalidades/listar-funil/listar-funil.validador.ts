import { z } from "zod";
import { ValidadorZod } from "@minicrm/nucleo/aplicacao";
import type { ListarFunilEntrada } from "./listar-funil.consulta";

const esquema = z.object({
  vendedorId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
});

export class ListarFunilValidador extends ValidadorZod<ListarFunilEntrada> {
  constructor() {
    super(esquema);
  }
}
