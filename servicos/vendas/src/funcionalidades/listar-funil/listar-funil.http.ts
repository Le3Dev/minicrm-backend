import type { HttpRequest } from "@azure/functions";
import { comUsuario, FuncaoHttp, lerQuery, registrarHttp, type IAutenticador } from "@minicrm/infra-azure";
import type { IManipulador, UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import type { Resultado } from "@minicrm/nucleo/dominio";
import { container } from "../../composicao/container";
import type { FunilDto } from "./listar-funil.handler";
import type { ListarFunilConsulta } from "./listar-funil.consulta";
import { ListarFunilValidador } from "./listar-funil.validador";

/** Adaptador de entrada: GET /funil?vendedorId=&clienteId= */
export class ListarFunilHttp extends FuncaoHttp<ListarFunilConsulta, FunilDto> {
  constructor(
    manipulador: IManipulador<ListarFunilConsulta, FunilDto>,
    autenticador: IAutenticador,
    private readonly validador = new ListarFunilValidador(),
  ) {
    super(manipulador, autenticador);
  }

  protected async montarComando(req: HttpRequest, usuario: UsuarioAutenticado | null): Promise<Resultado<ListarFunilConsulta>> {
    return comUsuario(this.validador.validar(lerQuery(req)), usuario);
  }
}

registrarHttp("listarFunil", { metodo: "GET", rota: "funil" }, () => new ListarFunilHttp(container().listarFunil, container().autenticador));
