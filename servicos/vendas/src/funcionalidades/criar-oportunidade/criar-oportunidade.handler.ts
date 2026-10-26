import { AcessoNegado, Perfil, RegistroNaoEncontrado, sucesso, type Resultado } from "@minicrm/nucleo/dominio";
import { executarComTratamento, type IManipulador } from "@minicrm/nucleo/aplicacao";
import { ClienteIndisponivel } from "../../dominio/erros";
import { Oportunidade } from "../../dominio/oportunidade";
import type {
  IClienteResumoRepositorio,
  IOportunidadeRepositorio,
  IPoliticaVisibilidade,
  IPublicadorEventos,
  IRelogio,
  IUnidadeDeTrabalho,
} from "../../aplicacao/portas";
import { paraOportunidadeDto, type OportunidadeDto } from "../../aplicacao/oportunidade-dto";
import type { CriarOportunidadeComando } from "./criar-oportunidade.comando";

/** Caso de uso: cadastrar oportunidade para um cliente visível ao usuário (RF07). */
export class CriarOportunidadeHandler implements IManipulador<CriarOportunidadeComando, OportunidadeDto> {
  constructor(
    private readonly repositorio: IOportunidadeRepositorio,
    private readonly clientes: IClienteResumoRepositorio,
    private readonly uow: IUnidadeDeTrabalho,
    private readonly publicador: IPublicadorEventos,
    private readonly visibilidade: IPoliticaVisibilidade,
    private readonly relogio: IRelogio,
  ) {}

  executar(cmd: CriarOportunidadeComando): Promise<Resultado<OportunidadeDto>> {
    return executarComTratamento(() =>
      this.uow.executar(async () => {
        const cliente = await this.clientes.obter(cmd.clienteId);
        if (!cliente) throw new RegistroNaoEncontrado("Cliente", cmd.clienteId);
        if (cliente.excluido) throw new ClienteIndisponivel();
        if (!(await this.visibilidade.podeAcessar(cmd.usuario, cliente.vendedorId))) throw new AcessoNegado();

        const vendedorId =
          cmd.usuario.perfil === Perfil.VENDEDOR ? cmd.usuario.id : (cmd.vendedorId ?? cliente.vendedorId);
        if (!(await this.visibilidade.podeAcessar(cmd.usuario, vendedorId))) throw new AcessoNegado();

        const oportunidade = Oportunidade.criar(
          {
            clienteId: cliente.clienteId,
            vendedorId,
            titulo: cmd.titulo,
            valorEstimado: cmd.valorEstimado,
            dataPrevista: cmd.dataPrevista,
            por: cmd.usuario.id,
          },
          this.relogio.agora(),
        );
        await this.repositorio.salvar(oportunidade);
        await this.publicador.registrar(oportunidade.extrairEventos());
        return sucesso(paraOportunidadeDto(oportunidade));
      }),
    );
  }
}
