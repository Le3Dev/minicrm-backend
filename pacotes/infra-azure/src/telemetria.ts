import { useAzureMonitor } from "@azure/monitor-opentelemetry";

let iniciada = false;

/** Liga o OpenTelemetry com exportação para o Application Insights, quando configurado. */
export function iniciarTelemetria(): void {
  if (iniciada || !process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) return;
  useAzureMonitor({ samplingRatio: 0.5 });
  iniciada = true;
}
