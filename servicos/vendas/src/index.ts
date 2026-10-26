/**
 * Ponto de entrada da Function App do Microsserviço de Vendas.
 * Cada import registra as funções de uma fatia vertical (HTTP ou evento).
 */
import { iniciarTelemetria, registrarConsumidorFila, usarAdaptadoresEmMemoria } from "@minicrm/infra-azure";
import { container, FILA_REENVIO_OUTBOX } from "./composicao/container";

iniciarTelemetria();

import "./funcionalidades/criar-oportunidade/criar-oportunidade.http";
import "./funcionalidades/mover-etapa/mover-etapa.http";
import "./funcionalidades/fechar-como-perdida/fechar-como-perdida.http";
import "./funcionalidades/fechar-como-ganha/fechar-como-ganha.http";
import "./funcionalidades/reabrir-oportunidade/reabrir-oportunidade.http";
import "./funcionalidades/listar-funil/listar-funil.http";
import "./funcionalidades/projetar-cliente/projetar-cliente.evento";
import "./funcionalidades/projetar-equipe/projetar-equipe.evento";

if (!usarAdaptadoresEmMemoria()) {
  registrarConsumidorFila("reenviarOutbox", FILA_REENVIO_OUTBOX, () => container().reenvioOutbox!);
}
