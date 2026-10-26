import { registrarConsumidor } from "@minicrm/infra-azure";
import { container } from "../../composicao/container";

/** Gatilho Event Grid: clientes.cliente.* (assinatura filtrada por tipo). */
registrarConsumidor("projetarCliente", () => container().projetarCliente);
