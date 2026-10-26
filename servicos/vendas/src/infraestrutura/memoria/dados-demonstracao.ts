import { usuarios, type EquipeEmMemoria } from "@minicrm/nucleo/testes";
import type { ClienteResumoEmMemoria } from "./repositorios-em-memoria";

/** Clientes de demonstração (mesmos ids usados no serviço de Clientes em modo local). */
export const CLIENTES_DEMONSTRACAO = {
  padaria: "10000000-0000-4000-8000-000000000001",
  oficina: "10000000-0000-4000-8000-000000000002",
  excluido: "10000000-0000-4000-8000-000000000003",
};

export async function carregarDadosDemonstracao(clientes: ClienteResumoEmMemoria, equipe: EquipeEmMemoria) {
  const base = { empresa: "", versao: 1, excluido: false };
  await clientes.salvar({ ...base, clienteId: CLIENTES_DEMONSTRACAO.padaria, nome: "Padaria Bom Pão", vendedorId: usuarios.vendedor.id });
  await clientes.salvar({ ...base, clienteId: CLIENTES_DEMONSTRACAO.oficina, nome: "Oficina Rápida", vendedorId: usuarios.outroVendedor.id });
  await clientes.salvar({ ...base, clienteId: CLIENTES_DEMONSTRACAO.excluido, nome: "Loja Fechada", vendedorId: usuarios.vendedor.id, excluido: true });
  for (const u of Object.values(usuarios)) {
    await equipe.salvar({
      usuarioId: u.id,
      nome: u.nome,
      perfil: u.perfil,
      gerenteId: u.id === usuarios.vendedor.id ? usuarios.gerente.id : null,
      ativo: true,
    });
  }
}
