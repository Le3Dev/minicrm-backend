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
import type { FecharComoGanhaComando } from "./fechar-como-ganha.comando";

/** Caso de uso: fechar oportunidade como ganha (RF09). O status do cliente muda por evento. */
export class FecharComoGanhaHandler implements IManipulador<FecharComoGanhaComando, OportunidadeDto> {
  constructor(
    private readonly repositorio: IOportunidadeRepositorio,
    private readonly uow: IUnidadeDeTrabalho,
    private readonly publicador: IPublicadorEventos,
    private readonly visibilidade: IPoliticaVisibilidade,
    private readonly relogio: IRelogio,
  ) {}

  executar(cmd: FecharComoGanhaComando): Promise<Resultado<OportunidadeDto>> {
    return executarComTratamento(() =>
      this.uow.executar(async () => {
        const oportunidade = await this.repositorio.obterPorId(cmd.oportunidadeId);
        if (!oportunidade) throw new RegistroNaoEncontrado("Oportunidade", cmd.oportunidadeId);
        if (!(await this.visibilidade.podeAcessar(cmd.usuario, oportunidade.vendedorId))) throw new AcessoNegado();

        oportunidade.fecharComoGanha(cmd.usuario.id, this.relogio.agora());

        await this.repositorio.salvar(oportunidade);
        await this.publicador.registrar(oportunidade.extrairEventos());
        return sucesso(paraOportunidadeDto(oportunidade));
      }),
    );
  }
}
