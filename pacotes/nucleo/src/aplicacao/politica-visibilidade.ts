import { Perfil } from "../dominio/perfil";
import { podeAcessarRegistroDe } from "../dominio/visibilidade";
import type { IEquipeProjecao, IPoliticaVisibilidade } from "./portas";
import type { UsuarioAutenticado } from "./usuario-autenticado";

/** Implementa a regra de visibilidade a partir da projeção local da equipe. */
export class VisibilidadePorEquipe implements IPoliticaVisibilidade {
  constructor(private readonly equipe: IEquipeProjecao) {}

  async podeAcessar(usuario: UsuarioAutenticado, responsavelId: string): Promise<boolean> {
    if (usuario.perfil !== Perfil.GERENTE) return podeAcessarRegistroDe(usuario, responsavelId, null);
    const responsavel = await this.equipe.obter(responsavelId);
    return podeAcessarRegistroDe(usuario, responsavelId, responsavel?.gerenteId ?? null);
  }

  async responsaveisVisiveis(usuario: UsuarioAutenticado): Promise<string[] | null> {
    switch (usuario.perfil) {
      case Perfil.ADMINISTRADOR:
        return null;
      case Perfil.VENDEDOR:
        return [usuario.id];
      case Perfil.GERENTE: {
        const vendedores = await this.equipe.listarVendedoresDe(usuario.id);
        return [usuario.id, ...vendedores.map((v) => v.usuarioId)];
      }
    }
  }
}
