import type { HttpRequest } from "@azure/functions";
import { comUsuario, FuncaoHttp, registrarHttp, type IAutenticador } from "@minicrm/infra-azure";
import type { IManipulador, UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { Resultado } from "@minicrm/nucleo/dominio";
import type { OportunidadeDto } from "../../aplicacao/oportunidade-dto";
import { container } from "../../composicao/container";
import type { FecharComoGanhaComando } from "./fechar-como-ganha.comando";
import { FecharComoGanhaValidador } from "./fechar-como-ganha.validador";

/** Adaptador de entrada: POST /oportunidades/{id}/ganho */
export class FecharComoGanhaHttp extends FuncaoHttp<FecharComoGanhaComando, OportunidadeDto> {
  constructor(
    manipulador: IManipulador<FecharComoGanhaComando, OportunidadeDto>,
    autenticador: IAutenticador,
    private readonly validador = new FecharComoGanhaValidador(),
  ) {
    super(manipulador, autenticador);
  }

  protected async montarComando(req: HttpRequest, usuario: UsuarioAutenticado | null): Promise<Resultado<FecharComoGanhaComando>> {
    return comUsuario(this.validador.validar({ oportunidadeId: req.params.id }), usuario);
  }
}

registrarHttp(
  "fecharComoGanha",
  { metodo: "POST", rota: "oportunidades/{id}/ganho" },
  () => new FecharComoGanhaHttp(container().fecharComoGanha, container().autenticador),
);
