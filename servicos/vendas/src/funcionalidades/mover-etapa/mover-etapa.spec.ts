import { describe, expect, it } from "vitest";
import { TipoEvento } from "@minicrm/contratos/tipos";
import { validarContrato } from "@minicrm/contratos/esquemas";
import { EtapaFunil } from "../../dominio/etapa-funil";
import { cenarioVendas } from "../../testes/cenario";
import { MoverEtapaHandler } from "./mover-etapa.handler";

async function preparar() {
  const c = await cenarioVendas();
  return { ...c, handler: new MoverEtapaHandler(c.repositorio, c.uow, c.publicador, c.visibilidade, c.relogio) };
}

describe("fatia: mover etapa", () => {
  it("move entre etapas abertas e publica OportunidadeMovida com a origem", async () => {
    const c = await preparar();
    const o = await c.oportunidade();
    const r = await c.handler.executar({ oportunidadeId: o.id, etapa: EtapaFunil.PROPOSTA, usuario: c.usuarios.vendedor });

    expect(r.ok && r.valor.etapa).toBe("PROPOSTA");
    expect(c.publicador.publicados[0]).toMatchObject({ tipo: TipoEvento.OportunidadeMovida, dados: { etapaOrigem: "PROSPECCAO" } });
    validarContrato(TipoEvento.OportunidadeMovida, c.publicador.publicados[0]!.dados);
  });

  it("não fecha pela movimentação comum", async () => {
    const c = await preparar();
    const o = await c.oportunidade();
    const r = await c.handler.executar({ oportunidadeId: o.id, etapa: EtapaFunil.FECHADO_GANHO, usuario: c.usuarios.vendedor });
    expect(!r.ok && r.erro.codigo).toBe("REGRA_NEGOCIO");
  });

  it("não move oportunidade fechada sem reabrir", async () => {
    const c = await preparar();
    const o = await c.oportunidade(EtapaFunil.FECHADO_PERDIDO);
    const r = await c.handler.executar({ oportunidadeId: o.id, etapa: EtapaFunil.CONTATO, usuario: c.usuarios.vendedor });
    expect(!r.ok && r.erro.message).toContain("reabra");
  });

  it("devolve 404 lógico para oportunidade inexistente", async () => {
    const c = await preparar();
    const r = await c.handler.executar({ oportunidadeId: globalThis.crypto.randomUUID(), etapa: EtapaFunil.CONTATO, usuario: c.usuarios.admin });
    expect(!r.ok && r.erro.codigo).toBe("NAO_ENCONTRADO");
  });
});
