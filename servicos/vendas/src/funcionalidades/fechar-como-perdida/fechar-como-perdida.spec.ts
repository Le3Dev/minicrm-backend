import { describe, expect, it } from "vitest";
import { TipoEvento } from "@minicrm/contratos/tipos";
import { validarContrato } from "@minicrm/contratos/esquemas";
import { EtapaFunil } from "../../dominio/etapa-funil";
import { cenarioVendas } from "../../testes/cenario";
import { FecharComoPerdidaHandler } from "./fechar-como-perdida.handler";
import { FecharComoPerdidaValidador } from "./fechar-como-perdida.validador";

async function preparar() {
  const c = await cenarioVendas();
  const handler = new FecharComoPerdidaHandler(c.repositorio, c.uow, c.publicador, c.visibilidade, c.relogio);
  return { ...c, handler };
}

describe("fatia: fechar oportunidade como perdida", () => {
  it("fecha com o motivo, grava o histórico e publica OportunidadePerdida", async () => {
    const c = await preparar();
    const o = await c.oportunidade(EtapaFunil.PROPOSTA);

    const r = await c.handler.executar({ oportunidadeId: o.id, motivo: "CONCORRENTE", usuario: c.usuarios.vendedor });

    expect(r.ok && r.valor).toMatchObject({ etapa: "FECHADO_PERDIDO", motivoPerda: "CONCORRENTE", versao: 2 });
    expect(c.publicador.tipos()).toEqual([TipoEvento.OportunidadePerdida]);
    validarContrato(TipoEvento.OportunidadePerdida, c.publicador.publicados[0]!.dados);
    expect(c.repositorio.historico.at(-1)).toMatchObject({ origem: "PROPOSTA", destino: "FECHADO_PERDIDO" });
  });

  it("recusa oportunidade já fechada (regra de transição)", async () => {
    const c = await preparar();
    const o = await c.oportunidade(EtapaFunil.FECHADO_GANHO);

    const r = await c.handler.executar({ oportunidadeId: o.id, motivo: "PRECO", usuario: c.usuarios.vendedor });

    expect(!r.ok && r.erro.codigo).toBe("REGRA_NEGOCIO");
    expect(c.publicador.publicados).toHaveLength(0);
  });

  it("gerente da equipe pode fechar; vendedor de outra carteira não pode", async () => {
    const c = await preparar();
    const o = await c.oportunidade(EtapaFunil.CONTATO);

    const outro = await c.handler.executar({ oportunidadeId: o.id, motivo: "PRECO", usuario: c.usuarios.outroVendedor });
    const gerente = await c.handler.executar({ oportunidadeId: o.id, motivo: "PRECO", usuario: c.usuarios.gerente });

    expect(!outro.ok && outro.erro.codigo).toBe("PROIBIDO");
    expect(gerente.ok).toBe(true);
  });

  it("o validador exige um motivo da lista", () => {
    const v = new FecharComoPerdidaValidador();
    expect(v.validar({ oportunidadeId: globalThis.crypto.randomUUID() }).ok).toBe(false);
    expect(v.validar({ oportunidadeId: globalThis.crypto.randomUUID(), motivo: "SEM_VERBA" }).ok).toBe(true);
  });
});
