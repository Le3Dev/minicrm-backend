import { sucesso, type Resultado } from "@minicrm/nucleo/dominio";
import type { IManipulador } from "@minicrm/nucleo/aplicacao";
import { montarFunil, type ColunaFunil } from "../../dominio/funil";
import type { IConsultaFunil, IPoliticaVisibilidade } from "../../aplicacao/portas";
import type { ListarFunilConsulta } from "./listar-funil.consulta";

export interface FunilDto {
  colunas: ColunaFunil[];
}

/** Consulta: colunas do funil com totais por etapa, só com oportunidades visíveis ao usuário (RF08). */
export class ListarFunilHandler implements IManipulador<ListarFunilConsulta, FunilDto> {
  constructor(
    private readonly consulta: IConsultaFunil,
    private readonly visibilidade: IPoliticaVisibilidade,
  ) {}

  async executar(c: ListarFunilConsulta): Promise<Resultado<FunilDto>> {
    const responsaveis = await this.visibilidade.responsaveisVisiveis(c.usuario);
    const cards = await this.consulta.listarCards({ responsaveis, vendedorId: c.vendedorId, clienteId: c.clienteId });
    return sucesso({ colunas: montarFunil(cards) });
  }
}
