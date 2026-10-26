import type { Oportunidade } from "../../dominio/oportunidade";

/** Porta de escrita do agregado Oportunidade. */
export interface IOportunidadeRepositorio {
  obterPorId(id: string): Promise<Oportunidade | null>;
  /** Grava o agregado e o histórico de etapas; lança ConflitoConcorrencia se a versão mudou. */
  salvar(oportunidade: Oportunidade): Promise<void>;
}
