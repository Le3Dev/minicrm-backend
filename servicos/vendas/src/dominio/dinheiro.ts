import { ErroValidacao } from "@minicrm/nucleo/dominio";

/** Valor monetário em reais, guardado em centavos para evitar erro de arredondamento. */
export class Dinheiro {
  private constructor(readonly centavos: number) {}

  static de(valor: number): Dinheiro {
    if (!Number.isFinite(valor) || valor < 0) throw new ErroValidacao("O valor estimado deve ser zero ou positivo.");
    return new Dinheiro(Math.round(valor * 100));
  }

  get valor(): number {
    return this.centavos / 100;
  }

  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos + outro.centavos);
  }

  static readonly ZERO = new Dinheiro(0);
}
