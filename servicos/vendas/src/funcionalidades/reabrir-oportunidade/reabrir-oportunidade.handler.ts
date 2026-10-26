import { AcessoNegado, RegistroNaoEncontrado, sucesso, type Resultado } from "@minicrm/nucleo/dominio";
import { executarComTratamento, type IManipulador } from "@minicrm/nucleo/aplicacao";
import type {
  IOportunidadeRepositorio,
  IPoliticaVisibilidade,
  IPublicadorEventos,
  IRelogio,
  IUnidadeDeTrabalho,
} from "../../aplicacao/portas";
import { paraOportunidadeDto, type OportunidadeDto } from "../../aplicacao/oportunidade-dto";
import type { ReabrirOportunidadeComando } from "./reabrir-oportunidade.comando";

/** Caso de uso: reabrir oportunidade fechada por ação explícita (RF19). */
export class ReabrirOportunidadeHandler implements IManipulador<ReabrirOportunidadeComando, OportunidadeDto> {
  constructor(
    private readonly repositorio: IOportunidadeRepositorio,
    private readonly uow: IUnidadeDeTrabalho,
    private readonly publicador: IPublicadorEventos,
    private readonly visibilidade: IPoliticaVisibilidade,
    private readonly relogio: IRelogio,
  ) {}

  executar(cmd: ReabrirOportunidadeComando): Promise<Resultado<OportunidadeDto>> {
    return executarComTratamento(() =>
      this.uow.executar(async () => {
        const oportunidade = await this.repositorio.obterPorId(cmd.oportunidadeId);
        if (!oportunidade) throw new RegistroNaoEncontrado("Oportunidade", cmd.oportunidadeId);
        if (!(await this.visibilidade.podeAcessar(cmd.usuario, oportunidade.vendedorId))) throw new AcessoNegado();

        oportunidade.reabrir(cmd.usuario.id, this.relogio.agora());

        await this.repositorio.salvar(oportunidade);
        await this.publicador.registrar(oportunidade.extrairEventos());
        return sucesso(paraOportunidadeDto(oportunidade));
      }),
    );
  }
}
