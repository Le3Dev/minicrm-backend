import type { EventoDeDominio } from "@minicrm/nucleo/dominio";
import type { EventoRecebido } from "@minicrm/nucleo/aplicacao";

export interface CloudEventMiniCrm {
  id: string;
  type: string;
  source: string;
  subject: string;
  time: Date;
  datacontenttype: "application/json";
  data: unknown;
  extensionAttributes: { versaoagregado: number };
}

export function paraCloudEvent(evento: EventoDeDominio, origem: string): CloudEventMiniCrm {
  return {
    id: evento.id,
    type: evento.tipo,
    source: origem,
    subject: evento.assunto,
    time: evento.ocorridoEm,
    datacontenttype: "application/json",
    data: evento.dados,
    extensionAttributes: { versaoagregado: evento.versaoAgregado },
  };
}

/** Converte o evento entregue pelo gatilho do Event Grid (esquema CloudEvents) em evento de domínio. */
export function deCloudEvent(bruto: unknown): EventoRecebido {
  const e = bruto as Record<string, unknown>;
  const tipo = (e["type"] ?? e["eventType"]) as string | undefined;
  if (!e["id"] || !tipo) throw new Error("Evento recebido sem id ou tipo.");
  return {
    id: String(e["id"]),
    tipo,
    assunto: String(e["subject"] ?? ""),
    ocorridoEm: new Date(String(e["time"] ?? e["eventTime"] ?? new Date().toISOString())),
    versaoAgregado: Number(e["versaoagregado"] ?? 0),
    dados: e["data"],
  };
}
