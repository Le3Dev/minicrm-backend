import { describe, expect, it } from "vitest";
import { TipoEvento } from "@minicrm/contratos/tipos";
import { EtapaFunil } from "../../dominio/etapa-funil";
import { cenarioVendas } from "../../testes/cenario";
import { FecharComoGanhaHandler } from "./fechar-como-ganha.handler";

describe("fatia: fechar oportunidade como ganha", () => {
  it("fecha, registra a data de fechamento e publica OportunidadeGanha", async () => {
    const c = await cenarioVendas();
    const handler = new FecharComoGanhaHandler(c.repositorio, c.uow, c.publicador, c.visibilidade, c.relogio);
    const o = await c.oportunidade(EtapaFunil.PROPOSTA);

    const r = await handler.executar({ oportunidadeId: o.id, usuario: c.usuarios.vendedor });

    expect(r.ok && r.valor).toMatchObject({ etapa: "FECHADO_GANHO", fechadaEm: c.relogio.agora().toISOString() });
    expect(c.publicador.tipos()).toEqual([TipoEvento.OportunidadeGanha]);
  });

  it("não fecha duas vezes", async () => {
    const c = await cenarioVendas();
    const handler = new FecharComoGanhaHandler(c.repositorio, c.uow, c.publicador, c.visibilidade, c.relogio);
    const o = await c.oportunidade(EtapaFunil.FECHADO_GANHO);
    const r = await handler.executar({ oportunidadeId: o.id, usuario: c.usuarios.vendedor });
    expect(r.ok).toBe(false);
  });
});
