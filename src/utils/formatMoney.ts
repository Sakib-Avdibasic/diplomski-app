export function shouldUseBillions(valuesInMillions: number[]): boolean {
  return valuesInMillions.some((v) => v >= 1000);
}

export function formatMoney(valueInMillions: number, useBillions: boolean): string {
  if (useBillions) {
    return `${(valueInMillions / 1000).toLocaleString("bs-BA", {
      maximumFractionDigits: 2,
    })} mlrd $`;
  }
  return `${valueInMillions.toLocaleString("bs-BA", {
    maximumFractionDigits: 1,
  })} mil $`;
}