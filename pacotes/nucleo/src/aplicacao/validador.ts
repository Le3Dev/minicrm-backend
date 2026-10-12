import type { z } from "zod";
import { ErroValidacao } from "../dominio/erros";
import { falha, sucesso, type Resultado } from "../dominio/resultado";

export interface IValidador<T> {
  validar(entrada: unknown): Resultado<T>;
}

/** Validador baseado em esquema Zod. Cada fatia declara o seu esquema numa subclasse. */
export abstract class ValidadorZod<T> implements IValidador<T> {
  protected constructor(private readonly esquema: z.ZodType<T>) {}

  validar(entrada: unknown): Resultado<T> {
    const resultado = this.esquema.safeParse(entrada);
    if (resultado.success) return sucesso(resultado.data);
    const campos = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message }));
    return falha(new ErroValidacao("Dados inválidos.", { campos }));
  }
}
