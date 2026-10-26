/**
 * Regras de dependência da Clean Architecture e do Vertical Slice (seção 5.3.4 do arc42).
 * Executar com: pnpm lint:dependencias
 */
const SERVICO = "^(servicos/[^/]+|bff/[^/]+)/src";

module.exports = {
  forbidden: [
    {
      name: "1-dominio-isolado",
      comment: "O domínio só conhece o próprio domínio, o núcleo de domínio e os tipos de contrato (sem Azure, banco, HTTP ou validação).",
      severity: "error",
      from: { path: `${SERVICO}/dominio/` },
      to: {
        pathNot: [`${SERVICO}/dominio/`, "^pacotes/nucleo/src/dominio/", "^pacotes/contratos/src/tipos\\.ts$"],
      },
    },
    {
      name: "2-handler-depende-de-abstracoes",
      comment: "Handlers só usam domínio, portas e o núcleo; nunca adaptadores de infraestrutura.",
      severity: "error",
      from: { path: `${SERVICO}/funcionalidades/[^/]+/[^/]+\\.handler\\.ts$` },
      to: { path: [`${SERVICO}/infraestrutura/`, `${SERVICO}/composicao/`, "^pacotes/infra-azure/", "node_modules/(mssql|@azure)"] },
    },
    {
      name: "3-fatias-independentes",
      comment: "Uma fatia vertical não importa código de outra fatia.",
      severity: "error",
      from: { path: `${SERVICO}/funcionalidades/([^/]+)/` },
      to: { path: `${SERVICO}/funcionalidades/`, pathNot: "^$1/src/funcionalidades/$2/" },
    },
    {
      name: "4-infraestrutura-nao-e-usada-pelo-nucleo",
      comment: "Domínio e camada de aplicação não importam adaptadores.",
      severity: "error",
      from: { path: [`${SERVICO}/dominio/`, `${SERVICO}/aplicacao/`] },
      to: { path: [`${SERVICO}/infraestrutura/`, `${SERVICO}/composicao/`, "^pacotes/infra-azure/"] },
    },
    {
      name: "5-composicao-instancia-adaptadores",
      comment: "Somente a raiz de composição (e os testes) importa os adaptadores de infraestrutura do serviço.",
      severity: "error",
      from: { path: `${SERVICO}/`, pathNot: [`${SERVICO}/composicao/`, `${SERVICO}/infraestrutura/`, `${SERVICO}/testes/`, "\\.spec\\.ts$"] },
      to: { path: `${SERVICO}/infraestrutura/` },
    },
    {
      name: "6-servicos-independentes",
      comment: "Um serviço não importa código de outro serviço; o que é comum fica em pacotes/.",
      severity: "error",
      from: { path: "^(servicos|bff)/([^/]+)/" },
      to: { path: "^(servicos|bff)/", pathNot: "^$1/$2/" },
    },
    {
      name: "sem-ciclos",
      severity: "error",
      from: {},
      to: { circular: true, viaOnly: { pathNot: "composicao/container\\.ts$" } },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: ["node_modules", "dist"] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".js", ".json"],
    },
  },
};
