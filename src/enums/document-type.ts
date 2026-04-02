export const DocumentType = {
  Invoice: "FATURA",
  ProducerReceipt: "MÜSTAHSİL MAKBUZU",
  SelfEmployedReceipt: "SERBEST MESLEK MAKBUZU",
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
export const documentTypeCases = (): DocumentType[] =>
  Object.values(DocumentType);
