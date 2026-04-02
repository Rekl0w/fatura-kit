import { FormatError } from "../errors";
import { FormatValidator } from "../utils";
import { asString } from "./helpers";

export type InvoiceReturnItemFields = {
  faturaNo: string;
  duzenlenmeTarihi: string;
};

export class InvoiceReturnItem {
  public readonly faturaNo: string;
  public readonly duzenlenmeTarihi: string;

  public static new(fields: InvoiceReturnItemFields): InvoiceReturnItem {
    return new InvoiceReturnItem(fields);
  }

  constructor(fields: InvoiceReturnItemFields) {
    this.faturaNo = asString(fields.faturaNo);
    this.duzenlenmeTarihi = asString(fields.duzenlenmeTarihi);

    if (!FormatValidator.invoiceNumber(this.faturaNo)) {
      throw new FormatError("Fatura numarası geçerli formatta değil.", fields);
    }

    if (!FormatValidator.date(this.duzenlenmeTarihi)) {
      throw new FormatError("Tarih geçerli formatta değil.", fields);
    }
  }

  public toArray(): InvoiceReturnItemFields {
    return {
      faturaNo: this.faturaNo,
      duzenlenmeTarihi: this.duzenlenmeTarihi,
    };
  }
}
