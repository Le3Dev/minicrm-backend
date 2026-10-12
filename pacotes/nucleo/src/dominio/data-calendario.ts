import { ErroValidacao } from "./erros";

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Data sem horário (AAAA-MM-DD), usada em vencimentos e datas previstas. */
export class DataCalendario {
  private constructor(readonly iso: string) {}

  static de(texto: string): DataCalendario {
    const m = FORMATO.exec(texto);
    if (!m) throw new ErroValidacao(`Data inválida: ${texto}. Use o formato AAAA-MM-DD.`);
    const data = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    if (data.toISOString().slice(0, 10) !== texto) throw new ErroValidacao(`Data inválida: ${texto}.`);
    return new DataCalendario(texto);
  }

  /** Data local de um instante no fuso informado (padrão: horário de Brasília). */
  static hojeEm(instante: Date, fuso = "America/Sao_Paulo"): DataCalendario {
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: fuso,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instante);
    return new DataCalendario(partes);
  }

  /** Quantidade de dias de `this` até `outra` (negativo se `outra` for anterior). */
  diasAte(outra: DataCalendario): number {
    return Math.round((Date.parse(outra.iso) - Date.parse(this.iso)) / UM_DIA_MS);
  }

  ehAnteriorA(outra: DataCalendario): boolean {
    return this.iso < outra.iso;
  }

  toString(): string {
    return this.iso;
  }
}
