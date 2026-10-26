import type { HttpRequest } from "@azure/functions";
import { comUsuario, FuncaoHttp, lerJson, registrarHttp, type IAutenticador } from "@minicrm/infra-azure";
import type { IManipulador, UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { Resultado } from "@minicrm/nucleo/dominio";
import type { OportunidadeDto } from "../../aplicacao/oportunidade-dto";
import { container } from "../../composicao/container";
import type { CriarOportunidadeComando } from "./criar-oportunidade.comando";
import { CriarOportunidadeValidador } from "./criar-oportunidade.validador";

/** Adaptador de entrada: POST /oportunidades */
export class CriarOportunidadeHttp extends FuncaoHttp<CriarOportunidadeComando, OportunidadeDto> {
  constructor(
    manipulador: IManipulador<CriarOportunidadeComando, OportunidadeDto>,
    autenticador: IAutenticador,
    private readonly validador = new CriarOportunidadeValidador(),
  ) {
    super(manipulador, autenticador, { statusSucesso: 201 });
  }

  protected async montarComando(req: HttpRequest, usuario: UsuarioAutenticado | null): Promise<Resultado<CriarOportunidadeComando>> {
    return comUsuario(this.validador.validar(await lerJson(req)), usuario);
  }
}

registrarHttp(
  "criarOportunidade",
  { metodo: "POST", rota: "oportunidades" },
  () => new CriarOportunidadeHttp(container().criarOportunidade, container().autenticador),
);
