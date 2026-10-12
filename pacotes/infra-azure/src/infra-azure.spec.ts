import { HttpRequest, InvocationContext } from "@azure/functions";
import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { sucesso, ViolacaoRegraNegocio, falha, type Resultado } from "@minicrm/nucleo/dominio";
import type { IManipulador, UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import { AUDIENCIA_TOKEN, AutenticadorJwt, EMISSOR_TOKEN } from "./auth/autenticador";
import { FuncaoHttp, lerJson } from "./http/funcao-http";
import { deCloudEvent, paraCloudEvent } from "./eventos/cloud-event";

const SEGREDO = "segredo-de-teste-com-pelo-menos-32-caracteres";

async function token(perfil = "VENDEDOR") {
  return new SignJWT({ nome: "Vera", perfil })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("00000000-0000-4000-8000-000000000003")
    .setIssuer(EMISSOR_TOKEN)
    .setAudience(AUDIENCIA_TOKEN)
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(SEGREDO));
}

class Eco implements IManipulador<{ texto: string; usuario: UsuarioAutenticado }, string> {
  async executar(c: { texto: string; usuario: UsuarioAutenticado }): Promise<Resultado<string>> {
    if (c.texto === "erro") return falha(new ViolacaoRegraNegocio("teste", "Regra violada"));
    return sucesso(`${c.usuario.nome}: ${c.texto}`);
  }
}

class EcoHttp extends FuncaoHttp<{ texto: string; usuario: UsuarioAutenticado }, string> {
  constructor() {
    super(new Eco(), new AutenticadorJwt({ segredoLocal: SEGREDO }), { statusSucesso: 201 });
  }
  protected async montarComando(req: HttpRequest, usuario: UsuarioAutenticado | null) {
    const corpo = await lerJson(req);
    return sucesso({ texto: String(corpo["texto"]), usuario: usuario! });
  }
}

const requisicao = (corpo: object, autorizacao?: string) =>
  new HttpRequest({
    method: "POST",
    url: "http://localhost/api/eco",
    body: { string: JSON.stringify(corpo) },
    headers: autorizacao ? { authorization: `Bearer ${autorizacao}` } : {},
  });

describe("FuncaoHttp", () => {
  const ctx = new InvocationContext({ functionName: "eco" });

  it("exige JWT válido nas rotas protegidas", async () => {
    const resposta = await new EcoHttp().tratar(requisicao({ texto: "oi" }), ctx);
    expect(resposta.status).toBe(401);
  });

  it("executa o caso de uso e devolve o status de sucesso da fatia", async () => {
    const resposta = await new EcoHttp().tratar(requisicao({ texto: "oi" }, await token()), ctx);
    expect(resposta.status).toBe(201);
    expect(resposta.jsonBody).toBe("Vera: oi");
  });

  it("traduz erro de regra de negócio para 422 em Problem Details", async () => {
    const resposta = await new EcoHttp().tratar(requisicao({ texto: "erro" }, await token()), ctx);
    expect(resposta.status).toBe(422);
    expect(resposta.jsonBody).toMatchObject({ tipo: "REGRA_NEGOCIO", regra: "teste" });
  });
});

describe("CloudEvents", () => {
  it("faz a ida e a volta entre evento de domínio e CloudEvent", () => {
    const evento = {
      id: "e1",
      tipo: "br.minicrm.teste.v1",
      assunto: "oportunidade/1",
      ocorridoEm: new Date("2026-10-12T10:00:00Z"),
      versaoAgregado: 3,
      dados: { a: 1 },
    };
    const nuvem = paraCloudEvent(evento, "/minicrm/vendas");
    const recebido = deCloudEvent({ ...nuvem, ...nuvem.extensionAttributes, time: nuvem.time.toISOString() });
    expect(recebido).toEqual(evento);
  });
});
