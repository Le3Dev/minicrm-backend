import { describe, expect, it } from "vitest";
import { TipoEvento } from "@minicrm/contratos/tipos";
import { validarContrato } from "@minicrm/contratos/esquemas";
import { cenarioVendas } from "../../testes/cenario";
import { CriarOportunidadeHandler } from "./criar-oportunidade.handler";

async function preparar() {
  const c = await cenarioVendas();
  const handler = new CriarOportunidadeHandler(c.repositorio, c.clientes, c.uow, c.publicador, c.visibilidade, c.relogio);
  return { ...c, handler };
}

const dados = { titulo: "Contrato anual", valorEstimado: 12000.5, dataPrevista: "2026-12-15" };

describe("fatia: criar oportunidade", () => {
  it("cria em Prospecção para o próprio vendedor e publica OportunidadeCriada", async () => {
    const c = await preparar();
    const r = await c.handler.executar({ ...dados, clienteId: c.clientesIds.padaria, vendedorId: c.usuarios.outroVendedor.id, usuario: c.usuarios.vendedor });

    expect(r.ok && r.valor).toMatchObject({ etapa: "PROSPECCAO", vendedorId: c.usuarios.vendedor.id, valorEstimado: 12000.5, versao: 1 });
    expect(c.publicador.tipos()).toEqual([TipoEvento.OportunidadeCriada]);
    validarContrato(TipoEvento.OportunidadeCriada, c.publicador.publicados[0]!.dados);
  });

  it("não permite oportunidade para cliente excluído", async () => {
    const c = await preparar();
    const r = await c.handler.executar({ ...dados, clienteId: c.clientesIds.excluido, usuario: c.usuarios.vendedor });
    expect(!r.ok && r.erro.message).toContain("excluído");
  });

  it("vendedor não cria oportunidade para cliente de outra carteira", async () => {
    const c = await preparar();
    const r = await c.handler.executar({ ...dados, clienteId: c.clientesIds.oficina, usuario: c.usuarios.vendedor });
    expect(!r.ok && r.erro.codigo).toBe("PROIBIDO");
  });

  it("administrador pode atribuir a outro vendedor", async () => {
    const c = await preparar();
    const r = await c.handler.executar({ ...dados, clienteId: c.clientesIds.padaria, vendedorId: c.usuarios.outroVendedor.id, usuario: c.usuarios.admin });
    expect(r.ok && r.valor.vendedorId).toBe(c.usuarios.outroVendedor.id);
  });
});
