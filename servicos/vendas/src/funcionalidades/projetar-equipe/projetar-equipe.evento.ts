import { registrarConsumidor } from "@minicrm/infra-azure";
import { container } from "../../composicao/container";

/** Gatilho Event Grid: identidade.usuario.* */
registrarConsumidor("projetarEquipe", () => container().projetarEquipe);
