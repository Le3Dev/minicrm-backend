import { describe, expect, it } from "vitest";
import { DataCalendario } from "./data-calendario";
import { Perfil } from "./perfil";
import { podeAcessarRegistroDe } from "./visibilidade";

describe("regra de visibilidade", () => {
  it("administrador vê tudo, gerente vê a equipe e vendedor vê só o próprio", () => {
    expect(podeAcessarRegistroDe({ id: "a", perfil: Perfil.ADMINISTRADOR }, "v1", null)).toBe(true);
    expect(podeAcessarRegistroDe({ id: "g", perfil: Perfil.GERENTE }, "v1", "g")).toBe(true);
    expect(podeAcessarRegistroDe({ id: "g", perfil: Perfil.GERENTE }, "v2", "outro")).toBe(false);
    expect(podeAcessarRegistroDe({ id: "v1", perfil: Perfil.VENDEDOR }, "v1", null)).toBe(true);
    expect(podeAcessarRegistroDe({ id: "v1", perfil: Perfil.VENDEDOR }, "v2", null)).toBe(false);
  });
});

describe("DataCalendario", () => {
  it("calcula a data local de Brasília e a diferença em dias", () => {
    const hoje = DataCalendario.hojeEm(new Date("2026-10-13T02:00:00Z"));
    expect(hoje.iso).toBe("2026-10-12");
    expect(hoje.diasAte(DataCalendario.de("2026-10-27"))).toBe(15);
    expect(hoje.diasAte(DataCalendario.de("2026-10-11"))).toBe(-1);
  });

  it("rejeita datas inexistentes", () => {
    expect(() => DataCalendario.de("2026-02-30")).toThrow("Data inválida");
  });
});
