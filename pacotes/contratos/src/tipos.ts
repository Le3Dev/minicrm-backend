/**
 * Catálogo de eventos de domínio trocados entre os microsserviços (seção 8.2 do arc42).
 * Formato do tipo: br.minicrm.<contexto>.<agregado>.<evento>.v<versão>
 * Este arquivo não tem dependências de execução e pode ser importado pelo domínio.
 */
export const TipoEvento = {
  UsuarioCriado: "br.minicrm.identidade.usuario.criado.v1",
  UsuarioDesativado: "br.minicrm.identidade.usuario.desativado.v1",
  UsuarioReativado: "br.minicrm.identidade.usuario.reativado.v1",
  PerfilUsuarioAlterado: "br.minicrm.identidade.usuario.perfil-alterado.v1",

  ClienteCadastrado: "br.minicrm.clientes.cliente.cadastrado.v1",
  ClienteAtualizado: "br.minicrm.clientes.cliente.atualizado.v1",
  ClienteExcluido: "br.minicrm.clientes.cliente.excluido.v1",
  ResponsavelTransferido: "br.minicrm.clientes.cliente.responsavel-transferido.v1",
  StatusClienteAlterado: "br.minicrm.clientes.cliente.status-alterado.v1",
  ReuniaoAgendada: "br.minicrm.clientes.interacao.reuniao-agendada.v1",

  OportunidadeCriada: "br.minicrm.vendas.oportunidade.criada.v1",
  OportunidadeMovida: "br.minicrm.vendas.oportunidade.movida.v1",
  OportunidadeGanha: "br.minicrm.vendas.oportunidade.ganha.v1",
  OportunidadePerdida: "br.minicrm.vendas.oportunidade.perdida.v1",
  OportunidadeReaberta: "br.minicrm.vendas.oportunidade.reaberta.v1",

  TarefaCriada: "br.minicrm.tarefas.tarefa.criada.v1",
  TarefaConcluida: "br.minicrm.tarefas.tarefa.concluida.v1",
  TarefaEntrouEmFaixa: "br.minicrm.tarefas.tarefa.entrou-em-faixa.v1",
} as const;

export type TipoEvento = (typeof TipoEvento)[keyof typeof TipoEvento];

export const EVENTOS_IDENTIDADE = [
  TipoEvento.UsuarioCriado,
  TipoEvento.UsuarioDesativado,
  TipoEvento.UsuarioReativado,
  TipoEvento.PerfilUsuarioAlterado,
] as const;

export const EVENTOS_CLIENTE = [
  TipoEvento.ClienteCadastrado,
  TipoEvento.ClienteAtualizado,
  TipoEvento.ClienteExcluido,
  TipoEvento.ResponsavelTransferido,
  TipoEvento.StatusClienteAlterado,
] as const;

export const EVENTOS_OPORTUNIDADE = [
  TipoEvento.OportunidadeCriada,
  TipoEvento.OportunidadeMovida,
  TipoEvento.OportunidadeGanha,
  TipoEvento.OportunidadePerdida,
  TipoEvento.OportunidadeReaberta,
] as const;

export type PerfilContrato = "ADMINISTRADOR" | "GERENTE" | "VENDEDOR";
export type StatusClienteContrato = "PROSPECT" | "ATIVO" | "INATIVO";
export type EtapaContrato = "PROSPECCAO" | "CONTATO" | "PROPOSTA" | "FECHADO_GANHO" | "FECHADO_PERDIDO";
export type MotivoPerdaContrato = "PRECO" | "CONCORRENTE" | "SEM_VERBA" | "SEM_RESPOSTA";
export type FaixaContrato = "QUINZE_DIAS" | "UM_DIA" | "NO_DIA" | "VENCIDA";

export interface DadosUsuario {
  usuarioId: string;
  nome: string;
  email: string;
  perfil: PerfilContrato;
  gerenteId: string | null;
  ativo: boolean;
}

export interface DadosCliente {
  clienteId: string;
  nome: string;
  email: string;
  empresa: string;
  vendedorId: string;
  status: StatusClienteContrato;
  excluido: boolean;
}

export interface DadosResponsavelTransferido extends DadosCliente {
  vendedorAnteriorId: string;
}

export interface DadosStatusClienteAlterado {
  clienteId: string;
  vendedorId: string;
  statusAnterior: StatusClienteContrato;
  status: StatusClienteContrato;
}

export interface DadosReuniaoAgendada {
  clienteId: string;
  clienteNome: string;
  interacaoId: string;
  vendedorId: string;
  data: string;
}

export interface DadosOportunidade {
  oportunidadeId: string;
  clienteId: string;
  vendedorId: string;
  titulo: string;
  valorEstimado: number;
  dataPrevista: string;
  etapa: EtapaContrato;
  motivoPerda: MotivoPerdaContrato | null;
  fechadaEm: string | null;
  por: string;
}

export interface DadosOportunidadeMovida extends DadosOportunidade {
  etapaOrigem: EtapaContrato;
}

export interface DadosOportunidadeReaberta extends DadosOportunidade {
  etapaAnterior: EtapaContrato;
}

export interface DadosTarefa {
  tarefaId: string;
  titulo: string;
  responsavelId: string;
  dataVencimento: string;
  clienteId: string | null;
  oportunidadeId: string | null;
  concluida: boolean;
}

export interface DadosTarefaEntrouEmFaixa extends DadosTarefa {
  faixa: FaixaContrato;
}

/** Comandos assíncronos enviados por fila (não são eventos de domínio). */
export interface MensagemEmailRedefinicao {
  destinatario: string;
  nome: string;
  codigo: string;
  expiraEm: string;
}

export interface MensagemGerarRelatorio {
  pedidoId: string;
}
