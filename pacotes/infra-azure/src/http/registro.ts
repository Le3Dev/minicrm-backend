import { app, type HttpMethod } from "@azure/functions";
import type { FuncaoHttp } from "./funcao-http";

export interface RotaHttp {
  metodo: HttpMethod;
  rota: string;
}

/** Registra uma função HTTP no Azure Functions. A instância é criada na primeira chamada. */
export function registrarHttp(nome: string, { metodo, rota }: RotaHttp, fabrica: () => FuncaoHttp<unknown, unknown>): void {
  let funcao: FuncaoHttp<unknown, unknown> | undefined;
  app.http(nome, {
    methods: [metodo],
    route: rota,
    authLevel: "anonymous",
    handler: (req, ctx) => (funcao ??= fabrica()).tratar(req, ctx),
  });
}
