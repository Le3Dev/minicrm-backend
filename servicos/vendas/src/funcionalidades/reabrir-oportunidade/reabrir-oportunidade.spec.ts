import { describe, expect, it } from "vitest";
import { TipoEvento } from "@minicrm/contratos/tipos";
import { validarContrato } from "@minicrm/contratos/esquemas";
import { EtapaFunil } from "../../dominio/etapa-funil";
import { cenarioVendas } from "../../testes/cenario";
import { ReabrirOportunidadeHandler } from "./reabrir-oportunidade.handler";

async function preparar() {
  const c = await cenarioVendas();
  return { ...c, handler: new ReabrirOportunidadeHandler(c.repositorio, c.uow, c.publicador, c.visibilidade, c.relogio) };
}

describe("fatia: reabrir oportunidade", () => {
  it("volta para Proposta, limpa o motivo e informa a etapa anterior", async () => {
    const c = await preparar();
    const o = await c.oportunidade(EtapaFunil.FECHADO_PERDIDO);
    const r = await c.handler.executar({ oportunidadeId: o.id, usuario: c.usuarios.vendedor });

    expect(r.ok && r.valor).toMatchObject({ etapa: "PROPOSTA", motivoPerda: null, fechadaEm: null });
    expect(c.publicador.publicados[0]).toMatchObject({ tipo: TipoEvento.OportunidadeReaberta, dados: { etapaAnterior: "FECHADO_PERDIDO" } });
    validarContrato(TipoEvento.OportunidadeReaberta, c.publicador.publicados[0]!.dados);
  });

  it("recusa reabrir oportunidade aberta", async () => {
    const c = await preparar();
    const o = await c.oportunidade(EtapaFunil.CONTATO);
    const r = await c.handler.executar({ oportunidadeId: o.id, usuario: c.usuarios.vendedor });
    expect(!r.ok && r.erro.codigo).toBe("REGRA_NEGOCIO");
  });
});
