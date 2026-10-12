/** Leitura das configurações de ambiente (app settings do Azure Functions ou local.settings.json). */
export function variavel(nome: string, padrao?: string): string {
  const valor = process.env[nome] ?? padrao;
  if (valor === undefined || valor === "") throw new Error(`Configuração ausente: ${nome}`);
  return valor;
}

export function variavelOpcional(nome: string): string | undefined {
  const valor = process.env[nome];
  return valor === undefined || valor === "" ? undefined : valor;
}

/** Em modo "memoria" os serviços sobem sem Azure (desenvolvimento e demonstração local). */
export function usarAdaptadoresEmMemoria(): boolean {
  return (process.env.MODO_ADAPTADORES ?? "memoria") === "memoria";
}
