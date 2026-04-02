export const ObjectionMethod = {
  Noter: "NOTER",
  TaahhutluMektup: "TAAHHUTLU_MEKTUP",
  Telgraf: "TELGRAF",
  Kep: "KEP",
} as const;

export type ObjectionMethod = (typeof ObjectionMethod)[keyof typeof ObjectionMethod];
export const objectionMethodCases = (): ObjectionMethod[] => Object.values(ObjectionMethod);
