const patterns = {
  invoiceNumber: /^(GIB)[a-zA-Z0-9]{13}$/,
  gtipCode: /^[0-9]{12}$/,
  date: /(0[1-9]|1[0-9]|2[0-9]|3(0|1))\/(0[1-9]|1[0-2])\/\d{4}/,
  time: /^(?:2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

export const FormatValidator = {
  invoiceNumber(value: string): boolean {
    return patterns.invoiceNumber.test(value);
  },
  gtipCode(value: string): boolean {
    return patterns.gtipCode.test(value);
  },
  date(value: string): boolean {
    return patterns.date.test(value);
  },
  time(value: string): boolean {
    return patterns.time.test(value);
  },
  uuid(value: string): boolean {
    return patterns.uuid.test(value);
  },
};
