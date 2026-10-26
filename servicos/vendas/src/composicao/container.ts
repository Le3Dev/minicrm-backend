import {
  autenticadorDoAmbiente,
  BancoSql,
  CanalEventGrid,
  CanalEventosLog,
  DespachanteOutbox,
  EquipeProjecaoSql,
  EventosProcessadosSql,
  FilaArmazenamento,
  PublicadorOutboxSql,
  RelogioSistema,
  ReenvioOutbox,
  UnidadeDeTrabalhoSql,
  usarAdaptadoresEmMemoria,
  variavel,
  type IAutenticador,
  type MensagemReenvioOutbox,
} from "@minicrm/infra-azure";
import {
  ConsumidorIdempotente,
  VisibilidadePorEquipe,
  type EventoRecebido,
  type IManipulador,
  type IEquipeProjecao,
  type IPublicadorEventos,
  type IRegistroEventosProcessados,
  type IRelogio,
  type IUnidadeDeTrabalho,
} from "@minicrm/nucleo/aplicacao";
import {
  EquipeEmMemoria,
  EventosProcessadosEmMemoria,
  PublicadorEmMemoria,
  UnidadeDeTrabalhoEmMemoria,
} from "@minicrm/nucleo/testes";
import type { IClienteResumoRepositorio, IConsultaFunil, IOportunidadeRepositorio } from "../aplicacao/portas";
import { CriarOportunidadeHandler } from "../funcionalidades/criar-oportunidade/criar-oportunidade.handler";
import { MoverEtapaHandler } from "../funcionalidades/mover-etapa/mover-etapa.handler";
import { FecharComoPerdidaHandler } from "../funcionalidades/fechar-como-perdida/fechar-como-perdida.handler";
import { FecharComoGanhaHandler } from "../funcionalidades/fechar-como-ganha/fechar-como-ganha.handler";
import { ReabrirOportunidadeHandler } from "../funcionalidades/reabrir-oportunidade/reabrir-oportunidade.handler";
import { ListarFunilHandler } from "../funcionalidades/listar-funil/listar-funil.handler";
import { ProjetarClienteHandler } from "../funcionalidades/projetar-cliente/projetar-cliente.handler";
import { ProjetarEquipeHandler } from "../funcionalidades/projetar-equipe/projetar-equipe.handler";
import { carregarDadosDemonstracao } from "../infraestrutura/memoria/dados-demonstracao";
import {
  ClienteResumoEmMemoria,
  ConsultaFunilEmMemoria,
  OportunidadeRepositorioEmMemoria,
} from "../infraestrutura/memoria/repositorios-em-memoria";
import { ClienteResumoSql } from "../infraestrutura/sql/cliente-resumo-sql";
import { ConsultaFunilSql } from "../infraestrutura/sql/consulta-funil-sql";
import { OportunidadeRepositorioSql } from "../infraestrutura/sql/oportunidade-repositorio-sql";

export const ORIGEM_EVENTOS = "/minicrm/vendas";
export const FILA_REENVIO_OUTBOX = "outbox-reenvio-vendas";

/** Implementações das portas usadas pelo serviço. */
interface Portas {
  oportunidades: IOportunidadeRepositorio;
  consultaFunil: IConsultaFunil;
  clientes: IClienteResumoRepositorio;
  equipe: IEquipeProjecao;
  eventosProcessados: IRegistroEventosProcessados;
  uow: IUnidadeDeTrabalho;
  publicador: IPublicadorEventos;
  relogio: IRelogio;
  autenticador: IAutenticador;
  reenvioOutbox?: ReenvioOutbox;
}

/**
 * Raiz de composição: único lugar que conhece as implementações concretas.
 * As fatias recebem apenas interfaces (inversão de dependência).
 */
function montar(p: Portas) {
  const visibilidade = new VisibilidadePorEquipe(p.equipe);
  const idempotente = <T>(consumidor: IManipulador<EventoRecebido<T>, void>) =>
    new ConsumidorIdempotente<T>(consumidor, p.eventosProcessados, p.uow);

  return {
    autenticador: p.autenticador,
    reenvioOutbox: p.reenvioOutbox,
    criarOportunidade: new CriarOportunidadeHandler(p.oportunidades, p.clientes, p.uow, p.publicador, visibilidade, p.relogio),
    moverEtapa: new MoverEtapaHandler(p.oportunidades, p.uow, p.publicador, visibilidade, p.relogio),
    fecharComoPerdida: new FecharComoPerdidaHandler(p.oportunidades, p.uow, p.publicador, visibilidade, p.relogio),
    fecharComoGanha: new FecharComoGanhaHandler(p.oportunidades, p.uow, p.publicador, visibilidade, p.relogio),
    reabrirOportunidade: new ReabrirOportunidadeHandler(p.oportunidades, p.uow, p.publicador, visibilidade, p.relogio),
    listarFunil: new ListarFunilHandler(p.consultaFunil, visibilidade),
    projetarCliente: idempotente(new ProjetarClienteHandler(p.clientes)),
    projetarEquipe: idempotente(new ProjetarEquipeHandler(p.equipe)),
  };
}

export type Container = ReturnType<typeof montar>;

function portasAzure(): Portas {
  const banco = BancoSql.doAmbiente();
  const filaReenvio = new FilaArmazenamento<MensagemReenvioOutbox>(variavel("ArmazenamentoFilas__queueServiceUri"), FILA_REENVIO_OUTBOX);
  const despachante = new DespachanteOutbox(banco, new CanalEventGrid(variavel("EVENT_GRID_ENDPOINT"), ORIGEM_EVENTOS), filaReenvio);
  return {
    oportunidades: new OportunidadeRepositorioSql(banco),
    consultaFunil: new ConsultaFunilSql(banco),
    clientes: new ClienteResumoSql(banco),
    equipe: new EquipeProjecaoSql(banco),
    eventosProcessados: new EventosProcessadosSql(banco),
    uow: new UnidadeDeTrabalhoSql(banco),
    publicador: new PublicadorOutboxSql(banco, despachante),
    relogio: new RelogioSistema(),
    autenticador: autenticadorDoAmbiente(),
    reenvioOutbox: new ReenvioOutbox(despachante),
  };
}

function portasEmMemoria(): Portas {
  const oportunidades = new OportunidadeRepositorioEmMemoria();
  const clientes = new ClienteResumoEmMemoria();
  const equipe = new EquipeEmMemoria();
  void carregarDadosDemonstracao(clientes, equipe);
  const canal = new CanalEventosLog(ORIGEM_EVENTOS);
  const publicador = new PublicadorEmMemoria();
  return {
    oportunidades,
    consultaFunil: new ConsultaFunilEmMemoria(oportunidades, clientes),
    clientes,
    equipe,
    eventosProcessados: new EventosProcessadosEmMemoria(),
    uow: new UnidadeDeTrabalhoEmMemoria(),
    publicador: {
      registrar: async (eventos) => {
        await publicador.registrar(eventos);
        await canal.publicar(eventos);
      },
    },
    relogio: new RelogioSistema(),
    autenticador: autenticadorDoAmbiente(),
  };
}

let instancia: Container | undefined;

export function container(): Container {
  instancia ??= montar(usarAdaptadoresEmMemoria() ? portasEmMemoria() : portasAzure());
  return instancia;
}
