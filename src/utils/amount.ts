export function amountFormat(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function mapWithAmountFormat<T extends Record<string, number>>(
  value: T,
): T {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, amountFormat(item)]),
  ) as T;
}

export function percentage(amount: number, rate: number): number {
  return (amount * rate) / 100;
}

export function arrayColumnSum<T>(
  items: T[],
  key: keyof T,
  callback?: (item: T) => boolean,
  amountFormatted = false,
): number {
  const filtered = callback ? items.filter(callback) : items;
  const values = filtered
    .map((item) => item[key])
    .filter((item) => typeof item === "number")
    .map((item) =>
      amountFormatted ? amountFormat(item as number) : (item as number),
    );

  return values.reduce((total, item) => total + item, 0);
}

export function arrayColumnSumWithAmountFormat<T>(
  items: T[],
  key: keyof T,
  callback?: (item: T) => boolean,
): number {
  return arrayColumnSum(items, key, callback, true);
}
