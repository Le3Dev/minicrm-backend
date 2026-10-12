import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["pacotes/**/src/**/*.spec.ts", "servicos/**/src/**/*.spec.ts", "bff/**/src/**/*.spec.ts"],
    environment: "node",
    reporters: ["default"],
  },
});
