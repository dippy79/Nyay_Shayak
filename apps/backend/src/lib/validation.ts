/** Standard Indian eCourts CNR format: STATE+COURT+SEQ-YEAR or compact variant. */
const CNR_PATTERN = /^[A-Z]{2,6}\d{0,2}-?\d{6}-?\d{4}$/i;

export function isValidCNR(cnr: string): boolean {
  return CNR_PATTERN.test(cnr.trim());
}

export function normalizeCNR(cnr: string): string {
  return cnr.trim().toUpperCase();
}
