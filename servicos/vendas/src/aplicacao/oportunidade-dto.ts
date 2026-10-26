import type { Oportunidade } from "../dominio/oportunidade";

export interface OportunidadeDto {
  id: string;
  clienteId: string;
  vendedorId: string;
  titulo: string;
  valorEstimado: number;
  dataPrevista: string;
  etapa: string;
  motivoPerda: string | null;
  fechadaEm: string | null;
  versao: number;
}

export const paraOportunidadeDto = (o: Oportunidade): OportunidadeDto => ({
  id: o.id,
  clienteId: o.clienteId,
  vendedorId: o.vendedorId,
  titulo: o.titulo,
  valorEstimado: o.valorEstimado.valor,
  dataPrevista: o.dataPrevista.iso,
  etapa: o.etapa,
  motivoPerda: o.motivoPerda,
  fechadaEm: o.fechadaEm?.toISOString() ?? null,
  versao: o.versao,
});
