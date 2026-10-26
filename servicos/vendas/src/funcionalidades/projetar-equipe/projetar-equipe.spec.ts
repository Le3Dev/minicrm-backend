import { describe, expect, it } from "vitest";
import { ConsumidorIdempotente } from "@minicrm/nucleo/aplicacao";
import { eventoRecebido } from "@minicrm/nucleo/testes";
import { TipoEvento } from "@minicrm/contratos/tipos";
import { cenarioVendas } from "../../testes/cenario";
import { ProjetarEquipeHandler } from "./projetar-equipe.handler";

describe("fatia: projetar equipe", () => {
  it("registra o novo vendedor na equipe do gerente e ignora reentrega", async () => {
    const c = await cenarioVendas();
    const consumidor = new ConsumidorIdempotente(new ProjetarEquipeHandler(c.equipe), c.eventosProcessados, c.uow);
    const evento = eventoRecebido(TipoEvento.UsuarioCriado, {
      usuarioId: "30000000-0000-4000-8000-000000000001",
      nome: "Novo Vendedor",
      email: "novo@minicrm.com",
      perfil: "VENDEDOR" as const,
      gerenteId: c.usuarios.gerente.id,
      ativo: true,
    });

    await consumidor.executar(evento);
    await consumidor.executar(evento);

    const daEquipe = await c.equipe.listarVendedoresDe(c.usuarios.gerente.id);
    expect(daEquipe.map((m) => m.nome)).toContain("Novo Vendedor");
    expect(c.uow.transacoes).toBe(2);
    expect(await c.visibilidade.podeAcessar(c.usuarios.gerente, "30000000-0000-4000-8000-000000000001")).toBe(true);
  });
});
