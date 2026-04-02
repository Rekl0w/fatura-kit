export const Type = {
  eArsivFatura: "5000/30000",
  eArsivDiger: "Buyuk",
} as const;

export type Type = (typeof Type)[keyof typeof Type];

export function getTypeAlias(value: Type): string {
  return value === Type.eArsivFatura ? "E-Arşiv Fatura" : "E-Arşiv Diğer";
}
