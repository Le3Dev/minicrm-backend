import { describe, expect, it } from "vitest";
import { EtapaFunil } from "../../dominio/etapa-funil";
import { cenarioVendas } from "../../testes/cenario";
import { ListarFunilHandler } from "./listar-funil.handler";

describe("fatia: listar funil", () => {
  it("agrupa por etapa com totais e respeita a visibilidade de cada perfil", async () => {
    const c = await cenarioVendas();
    await c.oportunidade(EtapaFunil.PROSPECCAO);
    await c.oportunidade(EtapaFunil.PROPOSTA);
    await c.oportunidade(EtapaFunil.PROPOSTA, c.usuarios.outroVendedor.id);
    const handler = new ListarFunilHandler(c.consulta, c.visibilidade);

    const vendedora = await handler.executar({ usuario: c.usuarios.vendedor });
    const gerente = await handler.executar({ usuario: c.usuarios.gerente });
    const admin = await handler.executar({ usuario: c.usuarios.admin });

    const proposta = (r: typeof admin) => (r.ok ? r.valor.colunas.find((col) => col.etapa === "PROPOSTA") : undefined);
    expect(vendedora.ok && vendedora.valor.colunas.map((col) => col.etapa)).toEqual([
      "PROSPECCAO",
      "CONTATO",
      "PROPOSTA",
      "FECHADO_GANHO",
      "FECHADO_PERDIDO",
    ]);
    expect(proposta(vendedora)).toMatchObject({ quantidade: 1, valorTotal: 1500 });
    expect(proposta(gerente)).toMatchObject({ quantidade: 1 });
    expect(proposta(admin)).toMatchObject({ quantidade: 2, valorTotal: 3000 });
    expect(proposta(admin)?.cards[0]?.clienteNome).toBe("Padaria Bom Pão");
  });
});
