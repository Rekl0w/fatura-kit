export function applyKeyMap<T extends Record<string, unknown>>(
  data: T,
  keyMap: Record<string, string>,
  reverse = false,
): Record<string, unknown> {
  const mapper = reverse
    ? Object.fromEntries(Object.entries(keyMap).map(([left, right]) => [right, left]))
    : keyMap;

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [mapper[key] ?? key, value]),
  );
}
