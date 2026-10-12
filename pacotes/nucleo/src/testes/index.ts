import type { EventoDeDominio } from "../dominio/evento-dominio";
import { Perfil } from "../dominio/perfil";
import type {
  IEquipeProjecao,
  IPublicadorEventos,
  IRegistroEventosProcessados,
  IRelogio,
  IUnidadeDeTrabalho,
  MembroEquipe,
} from "../aplicacao/portas";
import type { UsuarioAutenticado } from "../aplicacao/usuario-autenticado";

/** Implementações em memória das portas comuns, usadas nos testes das fatias e no modo local. */
export class RelogioFixo implements IRelogio {
  constructor(private instante: Date = new Date("2026-10-12T13:00:00Z")) {}
  agora(): Date {
    return new Date(this.instante);
  }
  avancar(ms: number): void {
    this.instante = new Date(this.instante.getTime() + ms);
  }
}

export class UnidadeDeTrabalhoEmMemoria implements IUnidadeDeTrabalho {
  transacoes = 0;
  async executar<T>(trabalho: () => Promise<T>): Promise<T> {
    this.transacoes += 1;
    return trabalho();
  }
}

export class PublicadorEmMemoria implements IPublicadorEventos {
  readonly publicados: EventoDeDominio[] = [];
  async registrar(eventos: readonly EventoDeDominio[]): Promise<void> {
    this.publicados.push(...eventos);
  }
  tipos(): string[] {
    return this.publicados.map((e) => e.tipo);
  }
}

export class EquipeEmMemoria implements IEquipeProjecao {
  private readonly membros = new Map<string, MembroEquipe>();
  async obter(usuarioId: string) {
    return this.membros.get(usuarioId) ?? null;
  }
  async listarVendedoresDe(gerenteId: string) {
    return [...this.membros.values()].filter((m) => m.gerenteId === gerenteId);
  }
  async salvar(membro: MembroEquipe) {
    this.membros.set(membro.usuarioId, membro);
  }
}

export class EventosProcessadosEmMemoria implements IRegistroEventosProcessados {
  private readonly ids = new Set<string>();
  async jaProcessado(id: string) {
    return this.ids.has(id);
  }
  async marcar(id: string) {
    this.ids.add(id);
  }
}

export const usuarios = {
  admin: { id: "00000000-0000-4000-8000-000000000001", nome: "Ana Admin", perfil: Perfil.ADMINISTRADOR },
  gerente: { id: "00000000-0000-4000-8000-000000000002", nome: "Gil Gerente", perfil: Perfil.GERENTE },
  vendedor: { id: "00000000-0000-4000-8000-000000000003", nome: "Vera Vendedora", perfil: Perfil.VENDEDOR },
  outroVendedor: { id: "00000000-0000-4000-8000-000000000004", nome: "Otto Vendedor", perfil: Perfil.VENDEDOR },
} satisfies Record<string, UsuarioAutenticado>;

/** Equipe padrão dos testes: Vera é da equipe do Gil; Otto não tem gerente. */
export async function equipePadrao(): Promise<EquipeEmMemoria> {
  const equipe = new EquipeEmMemoria();
  await equipe.salvar({ ...membro(usuarios.gerente), gerenteId: null });
  await equipe.salvar({ ...membro(usuarios.vendedor), gerenteId: usuarios.gerente.id });
  await equipe.salvar({ ...membro(usuarios.outroVendedor), gerenteId: null });
  return equipe;
}

const membro = (u: UsuarioAutenticado): MembroEquipe => ({
  usuarioId: u.id,
  nome: u.nome,
  perfil: u.perfil,
  gerenteId: null,
  ativo: true,
});

export function eventoRecebido<T>(tipo: string, dados: T, versaoAgregado = 1, assunto = "teste"): EventoDeDominio<T> {
  return { id: globalThis.crypto.randomUUID(), tipo, assunto, ocorridoEm: new Date(), versaoAgregado, dados };
}
