import type { HttpRequest } from "@azure/functions";
import { comUsuario, FuncaoHttp, lerJson, registrarHttp, type IAutenticador } from "@minicrm/infra-azure";
import type { IManipulador, UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { Resultado } from "@minicrm/nucleo/dominio";
import type { OportunidadeDto } from "../../aplicacao/oportunidade-dto";
import { container } from "../../composicao/container";
import type { FecharComoPerdidaComando } from "./fechar-como-perdida.comando";
import { FecharComoPerdidaValidador } from "./fechar-como-perdida.validador";

/** Adaptador de entrada: POST /oportunidades/{id}/perda */
export class FecharComoPerdidaHttp extends FuncaoHttp<FecharComoPerdidaComando, OportunidadeDto> {
  constructor(
    manipulador: IManipulador<FecharComoPerdidaComando, OportunidadeDto>,
    autenticador: IAutenticador,
    private readonly validador = new FecharComoPerdidaValidador(),
  ) {
    super(manipulador, autenticador);
  }

  protected async montarComando(
    req: HttpRequest,
    usuario: UsuarioAutenticado | null,
  ): Promise<Resultado<FecharComoPerdidaComando>> {
    const entrada = this.validador.validar({ ...(await lerJson(req)), oportunidadeId: req.params.id });
    return comUsuario(entrada, usuario);
  }
}

registrarHttp(
  "fecharComoPerdida",
  { metodo: "POST", rota: "oportunidades/{id}/perda" },
  () => new FecharComoPerdidaHttp(container().fecharComoPerdida, container().autenticador),
);
