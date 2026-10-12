import type { EventoDeDominio } from "../dominio/evento-dominio";
import type { Perfil } from "../dominio/perfil";
import type { UsuarioAutenticado } from "./usuario-autenticado";

export interface IRelogio {
  agora(): Date;
}

/** Executa um trabalho dentro de uma transação. */
export interface IUnidadeDeTrabalho {
  executar<T>(trabalho: () => Promise<T>): Promise<T>;
}

/** Registra eventos para publicação após o commit (outbox). */
export interface IPublicadorEventos {
  registrar(eventos: readonly EventoDeDominio[]): Promise<void>;
}

/** Decide se o usuário pode ver ou alterar um registro de determinado responsável. */
export interface IPoliticaVisibilidade {
  podeAcessar(usuario: UsuarioAutenticado, responsavelId: string): Promise<boolean>;
  /** Ids dos vendedores visíveis ao usuário; `null` significa todos (Administrador). */
  responsaveisVisiveis(usuario: UsuarioAutenticado): Promise<string[] | null>;
}

export interface MembroEquipe {
  readonly usuarioId: string;
  readonly nome: string;
  readonly perfil: Perfil;
  readonly gerenteId: string | null;
  readonly ativo: boolean;
}

/** Projeção local da equipe, mantida pelos eventos do contexto Identidade. */
export interface IEquipeProjecao {
  obter(usuarioId: string): Promise<MembroEquipe | null>;
  listarVendedoresDe(gerenteId: string): Promise<MembroEquipe[]>;
  salvar(membro: MembroEquipe): Promise<void>;
}

/** Controle de idempotência dos consumidores de eventos. */
export interface IRegistroEventosProcessados {
  jaProcessado(eventoId: string): Promise<boolean>;
  marcar(eventoId: string, tipo: string): Promise<void>;
}
