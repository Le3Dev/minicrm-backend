import type { HttpRequest } from "@azure/functions";
import { comUsuario, FuncaoHttp, registrarHttp, type IAutenticador } from "@minicrm/infra-azure";
import type { IManipulador, UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { Resultado } from "@minicrm/nucleo/dominio";
import type { OportunidadeDto } from "../../aplicacao/oportunidade-dto";
import { container } from "../../composicao/container";
import type { ReabrirOportunidadeComando } from "./reabrir-oportunidade.comando";
import { ReabrirOportunidadeValidador } from "./reabrir-oportunidade.validador";

/** Adaptador de entrada: POST /oportunidades/{id}/reabertura */
export class ReabrirOportunidadeHttp extends FuncaoHttp<ReabrirOportunidadeComando, OportunidadeDto> {
  constructor(
    manipulador: IManipulador<ReabrirOportunidadeComando, OportunidadeDto>,
    autenticador: IAutenticador,
    private readonly validador = new ReabrirOportunidadeValidador(),
  ) {
    super(manipulador, autenticador);
  }

  protected async montarComando(req: HttpRequest, usuario: UsuarioAutenticado | null): Promise<Resultado<ReabrirOportunidadeComando>> {
    return comUsuario(this.validador.validar({ oportunidadeId: req.params.id }), usuario);
  }
}

registrarHttp(
  "reabrirOportunidade",
  { metodo: "POST", rota: "oportunidades/{id}/reabertura" },
  () => new ReabrirOportunidadeHttp(container().reabrirOportunidade, container().autenticador),
);
