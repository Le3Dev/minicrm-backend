import type { Resultado } from "../dominio/resultado";

/**
 * Contrato de todo caso de uso (handler de uma fatia vertical).
 * Os adaptadores de entrada (HTTP, eventos, filas, timer) dependem apenas desta interface.
 */
export interface IManipulador<C, R> {
  executar(comando: C): Promise<Resultado<R>>;
}
