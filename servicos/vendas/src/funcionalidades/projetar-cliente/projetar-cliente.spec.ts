import { describe, expect, it } from "vitest";
import { eventoRecebido } from "@minicrm/nucleo/testes";
import { TipoEvento, type DadosCliente } from "@minicrm/contratos/tipos";
import { cenarioVendas } from "../../testes/cenario";
import { ProjetarClienteHandler } from "./projetar-cliente.handler";

const dados = (vendedorId: string, nome: string): DadosCliente => ({
  clienteId: "20000000-0000-4000-8000-000000000001",
  nome,
  email: "contato@exemplo.com",
  empresa: "Exemplo Ltda",
  vendedorId,
  status: "PROSPECT",
  excluido: false,
});

describe("fatia: projetar cliente", () => {
  it("cria e atualiza o resumo, ignorando eventos fora de ordem", async () => {
    const c = await cenarioVendas();
    const handler = new ProjetarClienteHandler(c.clientes);
    const v = c.usuarios.vendedor.id;

    await handler.executar(eventoRecebido(TipoEvento.ClienteCadastrado, dados(v, "Nome 1"), 1));
    await handler.executar(eventoRecebido(TipoEvento.ClienteAtualizado, dados(v, "Nome 3"), 3));
    await handler.executar(eventoRecebido(TipoEvento.ClienteAtualizado, dados(v, "Nome 2 (atrasado)"), 2));

    expect(await c.clientes.obter("20000000-0000-4000-8000-000000000001")).toMatchObject({ nome: "Nome 3", versao: 3 });
  });
});
