import type { HttpRequest } from "@azure/functions";
import type { UsuarioAutenticado } from "@minicrm/nucleo/aplicacao";
import { PERFIS, type Perfil } from "@minicrm/nucleo/dominio";
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";

export interface IAutenticador {
  autenticar(req: HttpRequest): Promise<UsuarioAutenticado | null>;
}

export const EMISSOR_TOKEN = "minicrm-identidade";
export const AUDIENCIA_TOKEN = "minicrm-api";

export interface ConfiguracaoJwt {
  /** URL do JWKS publicado pelo MS Identidade (produção, RS256). */
  jwksUrl?: string;
  /** Segredo HS256 usado apenas no modo local. */
  segredoLocal?: string;
}

/**
 * Valida o JWT do usuário. O BFF repassa o token no cabeçalho `x-minicrm-usuario`;
 * chamadas diretas (modo local) podem usar `Authorization: Bearer`.
 */
export class AutenticadorJwt implements IAutenticador {
  private readonly chave: JWTVerifyGetKey | Uint8Array;

  constructor(config: ConfiguracaoJwt) {
    if (config.jwksUrl) this.chave = createRemoteJWKSet(new URL(config.jwksUrl));
    else if (config.segredoLocal) this.chave = new TextEncoder().encode(config.segredoLocal);
    else throw new Error("Configure JWT_JWKS_URL ou JWT_SEGREDO_LOCAL.");
  }

  async autenticar(req: HttpRequest): Promise<UsuarioAutenticado | null> {
    const token = extrairToken(req);
    if (!token) return null;
    try {
      const { payload } =
        this.chave instanceof Uint8Array
          ? await jwtVerify(token, this.chave, { issuer: EMISSOR_TOKEN, audience: AUDIENCIA_TOKEN })
          : await jwtVerify(token, this.chave, { issuer: EMISSOR_TOKEN, audience: AUDIENCIA_TOKEN });
      return paraUsuario(payload);
    } catch {
      return null;
    }
  }
}

function extrairToken(req: HttpRequest): string | null {
  const repassado = req.headers.get("x-minicrm-usuario");
  if (repassado) return repassado;
  const autorizacao = req.headers.get("authorization");
  return autorizacao?.startsWith("Bearer ") ? autorizacao.slice(7) : null;
}

function paraUsuario(payload: JWTPayload): UsuarioAutenticado | null {
  const perfil = payload["perfil"];
  const nome = payload["nome"];
  if (!payload.sub || typeof nome !== "string" || !PERFIS.includes(perfil as Perfil)) return null;
  return { id: payload.sub, nome, perfil: perfil as Perfil };
}

export function autenticadorDoAmbiente(): AutenticadorJwt {
  return new AutenticadorJwt({
    jwksUrl: process.env.JWT_JWKS_URL || undefined,
    segredoLocal: process.env.JWT_SEGREDO_LOCAL || undefined,
  });
}
