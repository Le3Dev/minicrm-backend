import { VisibilidadePorEquipe } from "@minicrm/nucleo/aplicacao";
import {
  EquipeEmMemoria,
  EventosProcessadosEmMemoria,
  PublicadorEmMemoria,
  RelogioFixo,
  UnidadeDeTrabalhoEmMemoria,
  usuarios,
} from "@minicrm/nucleo/testes";
import { EtapaFunil } from "../dominio/etapa-funil";
import { Oportunidade } from "../dominio/oportunidade";
import { CLIENTES_DEMONSTRACAO, carregarDadosDemonstracao } from "../infraestrutura/memoria/dados-demonstracao";
import {
  ClienteResumoEmMemoria,
  ConsultaFunilEmMemoria,
  OportunidadeRepositorioEmMemoria,
} from "../infraestrutura/memoria/repositorios-em-memoria";

/** Monta as portas em memória para os testes das fatias do serviço de Vendas. */
export async function cenarioVendas() {
  const repositorio = new OportunidadeRepositorioEmMemoria();
  const clientes = new ClienteResumoEmMemoria();
  const equipe = new EquipeEmMemoria();
  await carregarDadosDemonstracao(clientes, equipe);
  const relogio = new RelogioFixo();

  return {
    repositorio,
    clientes,
    equipe,
    relogio,
    consulta: new ConsultaFunilEmMemoria(repositorio, clientes),
    uow: new UnidadeDeTrabalhoEmMemoria(),
    publicador: new PublicadorEmMemoria(),
    eventosProcessados: new EventosProcessadosEmMemoria(),
    visibilidade: new VisibilidadePorEquipe(equipe),
    usuarios,
    clientesIds: CLIENTES_DEMONSTRACAO,

    /** Cria e grava uma oportunidade já na etapa desejada. */
    async oportunidade(etapa: EtapaFunil = EtapaFunil.PROSPECCAO, vendedorId = usuarios.vendedor.id) {
      const o = Oportunidade.criar(
        {
          clienteId: CLIENTES_DEMONSTRACAO.padaria,
          vendedorId,
          titulo: "Fornecimento mensal",
          valorEstimado: 1500,
          dataPrevista: "2026-11-30",
          por: vendedorId,
        },
        relogio.agora(),
      );
      if (etapa === EtapaFunil.CONTATO || etapa === EtapaFunil.PROPOSTA) o.moverPara(etapa, vendedorId, relogio.agora());
      if (etapa === EtapaFunil.FECHADO_GANHO) o.fecharComoGanha(vendedorId, relogio.agora());
      if (etapa === EtapaFunil.FECHADO_PERDIDO) o.fecharComoPerdida("PRECO", vendedorId, relogio.agora());
      await repositorio.salvar(o);
      o.extrairEventos();
      return o;
    },
  };
}
