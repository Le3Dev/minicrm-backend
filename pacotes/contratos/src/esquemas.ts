import { z } from "zod";
import { TipoEvento } from "./tipos";

/** Esquemas usados nos testes de contrato: o que um serviço publica precisa obedecer a eles. */
const perfil = z.enum(["ADMINISTRADOR", "GERENTE", "VENDEDOR"]);
const status = z.enum(["PROSPECT", "ATIVO", "INATIVO"]);
const etapa = z.enum(["PROSPECCAO", "CONTATO", "PROPOSTA", "FECHADO_GANHO", "FECHADO_PERDIDO"]);
const motivo = z.enum(["PRECO", "CONCORRENTE", "SEM_VERBA", "SEM_RESPOSTA"]);
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const esquemaUsuario = z.object({
  usuarioId: z.string().uuid(),
  nome: z.string().min(1),
  email: z.string().email(),
  perfil,
  gerenteId: z.string().uuid().nullable(),
  ativo: z.boolean(),
});

export const esquemaCliente = z.object({
  clienteId: z.string().uuid(),
  nome: z.string().min(1),
  email: z.string(),
  empresa: z.string(),
  vendedorId: z.string().uuid(),
  status,
  excluido: z.boolean(),
});

export const esquemaOportunidade = z.object({
  oportunidadeId: z.string().uuid(),
  clienteId: z.string().uuid(),
  vendedorId: z.string().uuid(),
  titulo: z.string().min(1),
  valorEstimado: z.number().nonnegative(),
  dataPrevista: data,
  etapa,
  motivoPerda: motivo.nullable(),
  fechadaEm: z.string().nullable(),
  por: z.string().uuid(),
});

export const esquemaTarefa = z.object({
  tarefaId: z.string().uuid(),
  titulo: z.string().min(1),
  responsavelId: z.string().uuid(),
  dataVencimento: data,
  clienteId: z.string().uuid().nullable(),
  oportunidadeId: z.string().uuid().nullable(),
  concluida: z.boolean(),
});

export const esquemasPorTipo: Record<string, z.ZodTypeAny> = {
  [TipoEvento.UsuarioCriado]: esquemaUsuario,
  [TipoEvento.UsuarioDesativado]: esquemaUsuario,
  [TipoEvento.UsuarioReativado]: esquemaUsuario,
  [TipoEvento.PerfilUsuarioAlterado]: esquemaUsuario,
  [TipoEvento.ClienteCadastrado]: esquemaCliente,
  [TipoEvento.ClienteAtualizado]: esquemaCliente,
  [TipoEvento.ClienteExcluido]: esquemaCliente,
  [TipoEvento.ResponsavelTransferido]: esquemaCliente.extend({ vendedorAnteriorId: z.string().uuid() }),
  [TipoEvento.StatusClienteAlterado]: z.object({
    clienteId: z.string().uuid(),
    vendedorId: z.string().uuid(),
    statusAnterior: status,
    status,
  }),
  [TipoEvento.ReuniaoAgendada]: z.object({
    clienteId: z.string().uuid(),
    clienteNome: z.string(),
    interacaoId: z.string().uuid(),
    vendedorId: z.string().uuid(),
    data: z.string(),
  }),
  [TipoEvento.OportunidadeCriada]: esquemaOportunidade,
  [TipoEvento.OportunidadeMovida]: esquemaOportunidade.extend({ etapaOrigem: etapa }),
  [TipoEvento.OportunidadeGanha]: esquemaOportunidade,
  [TipoEvento.OportunidadePerdida]: esquemaOportunidade,
  [TipoEvento.OportunidadeReaberta]: esquemaOportunidade.extend({ etapaAnterior: etapa }),
  [TipoEvento.TarefaCriada]: esquemaTarefa,
  [TipoEvento.TarefaConcluida]: esquemaTarefa,
  [TipoEvento.TarefaEntrouEmFaixa]: esquemaTarefa.extend({ faixa: z.enum(["QUINZE_DIAS", "UM_DIA", "NO_DIA", "VENCIDA"]) }),
};

/** Lança erro se os dados do evento não obedecerem ao contrato publicado. */
export function validarContrato(tipo: string, dados: unknown): void {
  const esquema = esquemasPorTipo[tipo];
  if (!esquema) throw new Error(`Tipo de evento sem contrato: ${tipo}`);
  esquema.parse(dados);
}
