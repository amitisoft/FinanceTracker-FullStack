export const currentYear = new Date().getFullYear();

export function isValidMoney(value: number) {
  return Number.isFinite(value) && value > 0 && Math.round(value * 100) === value * 100;
}

export function isValidNonNegativeMoney(value: number) {
  return Number.isFinite(value) && value >= 0 && Math.round(value * 100) === value * 100;
}

export function isValidMonth(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

export function isValidYear(value: number) {
  return Number.isInteger(value) && value >= currentYear && value <= 2100;
}