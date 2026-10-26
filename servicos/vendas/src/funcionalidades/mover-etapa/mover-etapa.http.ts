import type { HttpRequest } from "@azure/functions";
import { comUsuario, FuncaoHttp, lerJson, registrarHttp, type IAutenticador } from "@minicrm/infra-azure";
import type { IManipulador, UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { Resultado } from "@minicrm/nucleo/dominio";
import type { OportunidadeDto } from "../../aplicacao/oportunidade-dto";
import { container } from "../../composicao/container";
import type { MoverEtapaComando } from "./mover-etapa.comando";
import { MoverEtapaValidador } from "./mover-etapa.validador";

/** Adaptador de entrada: PATCH /oportunidades/{id}/etapa */
export class MoverEtapaHttp extends FuncaoHttp<MoverEtapaComando, OportunidadeDto> {
  constructor(
    manipulador: IManipulador<MoverEtapaComando, OportunidadeDto>,
    autenticador: IAutenticador,
    private readonly validador = new MoverEtapaValidador(),
  ) {
    super(manipulador, autenticador);
  }

  protected async montarComando(req: HttpRequest, usuario: UsuarioAutenticado | null): Promise<Resultado<MoverEtapaComando>> {
    return comUsuario(this.validador.validar({ ...(await lerJson(req)), oportunidadeId: req.params.id }), usuario);
  }
}

registrarHttp(
  "moverEtapa",
  { metodo: "PATCH", rota: "oportunidades/{id}/etapa" },
  () => new MoverEtapaHttp(container().moverEtapa, container().autenticador),
);
