/** Fuso padrão enquanto o perfil não guarda o fuso do usuário. */
export const FUSO_PADRAO = "America/Sao_Paulo";

/** Data local (YYYY-MM-DD) no fuso informado. */
export function dataLocal(agora: Date = new Date(), fuso: string = FUSO_PADRAO): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso }).format(agora);
}

export function somarDias(dataISO: string, dias: number): string {
  const d = new Date(`${dataISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
