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
import type { MoverEtapaComando } from "./mover-etapa.comando";

/** Caso de uso: mover a oportunidade entre as etapas abertas do funil (RF08). */
export class MoverEtapaHandler implements IManipulador<MoverEtapaComando, OportunidadeDto> {
  constructor(
    private readonly repositorio: IOportunidadeRepositorio,
    private readonly uow: IUnidadeDeTrabalho,
    private readonly publicador: IPublicadorEventos,
    private readonly visibilidade: IPoliticaVisibilidade,
    private readonly relogio: IRelogio,
  ) {}

  executar(cmd: MoverEtapaComando): Promise<Resultado<OportunidadeDto>> {
    return executarComTratamento(() =>
      this.uow.executar(async () => {
        const oportunidade = await this.repositorio.obterPorId(cmd.oportunidadeId);
        if (!oportunidade) throw new RegistroNaoEncontrado("Oportunidade", cmd.oportunidadeId);
        if (!(await this.visibilidade.podeAcessar(cmd.usuario, oportunidade.vendedorId))) throw new AcessoNegado();

        oportunidade.moverPara(cmd.etapa, cmd.usuario.id, this.relogio.agora());

        await this.repositorio.salvar(oportunidade);
        await this.publicador.registrar(oportunidade.extrairEventos());
        return sucesso(paraOportunidadeDto(oportunidade));
      }),
    );
  }
}
