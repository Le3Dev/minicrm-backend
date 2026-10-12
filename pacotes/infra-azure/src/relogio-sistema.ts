import type { IRelogio } from "@minicrm/nucleo/aplicacao";

export class RelogioSistema implements IRelogio {
  agora(): Date {
    return new Date();
  }
}
