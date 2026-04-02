import { InvoiceType, type Tax, Tax as TaxEnum, Unit, getInvoiceTypeReasons, getTaxCodes, getTaxRateByCode, taxFromCode, taxHasVat } from "../enums";
import { FormatError, ValidationError } from "../errors";
import { amountFormat, applyKeyMap, percentage, FormatValidator, mapWithAmountFormat } from "../utils";
import { BaseItem } from "./base-item";
import { asNumber, asString } from "./helpers";
import type { ModelMeta } from "./types";

export type InvoiceItemFields = {
  malHizmet: string;
  miktar: number;
  birimFiyat: number;
  kdvOrani: number;
  birim?: typeof Unit[keyof typeof Unit];
  fiyat?: number;
  iskontoTipi?: string;
  iskontoOrani?: number;
  iskontoTutari?: number;
  iskontoNedeni?: string;
  malHizmetTutari?: number;
  kdvTutari?: number;
  tevkifatKodu?: number;
  ozelMatrahNedeni?: number;
  ozelMatrahTutari?: number;
  gtip?: string;
};

const keyMap = {
  iskontoTipi: "iskontoArttm",
};

export class InvoiceItemModel extends BaseItem {
  public malHizmet: string;
  public miktar: number;
  public birimFiyat: number;
  public kdvOrani: number;
  public birim: typeof Unit[keyof typeof Unit];
  public fiyat: number;
  public iskontoTipi: string;
  public iskontoOrani: number;
  public iskontoTutari: number;
  public iskontoNedeni: string;
  public malHizmetTutari: number;
  public kdvTutari: number;
  public tevkifatKodu: number;
  public ozelMatrahNedeni: number;
  public ozelMatrahTutari: number;
  public gtip: string;

  constructor(fields: InvoiceItemFields, meta: ModelMeta = {}) {
    super(meta);
    this.malHizmet = asString(fields.malHizmet);
    this.miktar = asNumber(fields.miktar);
    this.birimFiyat = asNumber(fields.birimFiyat);
    this.kdvOrani = asNumber(fields.kdvOrani);
    this.birim = fields.birim ?? Unit.Adet;
    this.fiyat = asNumber(fields.fiyat);
    this.iskontoTipi = asString(fields.iskontoTipi, "İskonto") || "İskonto";
    this.iskontoOrani = asNumber(fields.iskontoOrani);
    this.iskontoTutari = asNumber(fields.iskontoTutari);
    this.iskontoNedeni = asString(fields.iskontoNedeni);
    this.malHizmetTutari = asNumber(fields.malHizmetTutari);
    this.kdvTutari = asNumber(fields.kdvTutari);
    this.tevkifatKodu = asNumber(fields.tevkifatKodu);
    this.ozelMatrahNedeni = asNumber(fields.ozelMatrahNedeni);
    this.ozelMatrahTutari = asNumber(fields.ozelMatrahTutari);
    this.gtip = asString(fields.gtip);

    if (![0, 1, 8, 10, 18, 20].includes(this.kdvOrani)) {
      throw new ValidationError("Geçersiz KDV oranı.", fields);
    }

    if (!["İskonto", "Arttırım"].includes(this.iskontoTipi)) {
      throw new ValidationError("Geçersiz iskonto tipi.", fields);
    }

    if (!this.imported) {
      this.fiyat = this.fiyat || this.miktar * this.birimFiyat;
      if (this.iskontoOrani && !this.iskontoTutari) {
        this.iskontoTutari = percentage(this.fiyat, this.iskontoOrani);
      }
      if (!this.malHizmetTutari) {
        this.malHizmetTutari = !this.iskontoTutari
          ? this.fiyat
          : this.iskontoTipi === "İskonto"
            ? this.fiyat - this.iskontoTutari
            : this.fiyat + this.iskontoTutari;
      }
      this.kdvTutari = this.kdvTutari || percentage(this.malHizmetTutari, this.kdvOrani);
    }
  }

  public static import(data: Record<string, unknown>): InvoiceItemModel {
    const mapped = applyKeyMap(data, keyMap, true);
    const item = new InvoiceItemModel({
      malHizmet: asString(mapped.malHizmet),
      miktar: asNumber(mapped.miktar),
      birimFiyat: asNumber(mapped.birimFiyat),
      kdvOrani: asNumber(mapped.kdvOrani),
      birim: (mapped.birim as typeof Unit[keyof typeof Unit]) ?? Unit.Adet,
      fiyat: asNumber(mapped.fiyat),
      iskontoTipi: asString(mapped.iskontoTipi, "İskonto"),
      iskontoOrani: asNumber(mapped.iskontoOrani),
      iskontoTutari: asNumber(mapped.iskontoTutari),
      iskontoNedeni: asString(mapped.iskontoNedeni),
      malHizmetTutari: asNumber(mapped.malHizmetTutari),
      kdvTutari: asNumber(mapped.kdvTutari),
      tevkifatKodu: asNumber(mapped.tevkifatKodu),
      ozelMatrahNedeni: asNumber(mapped.ozelMatrahNedeni),
      ozelMatrahTutari: asNumber(mapped.ozelMatrahTutari),
      gtip: asString(mapped.gtip),
    }, { imported: true, importSource: "model" });

    item.importTaxes(mapped);
    return item;
  }

  public static importFromApi(data: Record<string, unknown>): InvoiceItemModel {
    const mapped = applyKeyMap(data, keyMap, true);
    const item = new InvoiceItemModel(
      {
        malHizmet: asString(mapped.malHizmet),
        miktar: asNumber(mapped.miktar),
        birimFiyat: asNumber(mapped.birimFiyat),
        kdvOrani: asNumber(mapped.kdvOrani),
        birim: (mapped.birim as typeof Unit[keyof typeof Unit]) ?? Unit.Adet,
        fiyat: asNumber(mapped.fiyat),
        iskontoTipi: asString(mapped.iskontoTipi, "İskonto"),
        iskontoOrani: asNumber(mapped.iskontoOrani),
        iskontoTutari: asNumber(mapped.iskontoTutari),
        iskontoNedeni: asString(mapped.iskontoNedeni),
        malHizmetTutari: asNumber(mapped.malHizmetTutari),
        kdvTutari: asNumber(mapped.kdvTutari),
        tevkifatKodu: asNumber(mapped.tevkifatKodu),
        ozelMatrahNedeni: asNumber(mapped.ozelMatrahNedeni),
        ozelMatrahTutari: asNumber(mapped.ozelMatrahTutari),
        gtip: asString(mapped.gtip),
      },
      { imported: true, importSource: "api" },
    );

    item.importTaxes(mapped);
    return item;
  }

  private importTaxes(data: Record<string, unknown>): void {
    const taxMap = new Map<string, { rate?: number; amount?: number; vat?: number }>();

    for (const [key, value] of Object.entries(data)) {
      const normalized = key[0]?.toUpperCase() === "V" ? key : `${key[0]?.toUpperCase() ?? ""}${key.slice(1)}`;
      const match = normalized.match(/^V(.+?)(Orani|Tutari|KdvTutari)$/);
      if (!match) continue;
      const [, code, kind] = match;
      if (!code) continue;
      const current = taxMap.get(code) ?? {};
      if (kind === "Orani") current.rate = asNumber(value);
      if (kind === "Tutari") current.amount = asNumber(value);
      if (kind === "KdvTutari") current.vat = asNumber(value);
      taxMap.set(code, current);
    }

    for (const [code, payload] of taxMap.entries()) {
      const tax = taxFromCode(code);
      if (!tax || typeof payload.rate !== "number") continue;
      this.addTax(tax, payload.rate, payload.amount ?? 0, payload.vat ?? 0);
    }
  }

  public addTax(tax: Tax, rate: number, amount = 0, vat = 0): this {
    const resolvedAmount = amount ||
      (tax === TaxEnum.KDVTevkifat ? () => percentage(this.kdvTutari, rate) : percentage(this.malHizmetTutari, rate));

    let amountValue = resolvedAmount;
    if (tax === TaxEnum.OTV1ListeTevkifat && typeof amountValue !== "function") {
      amountValue *= this.miktar;
    }

    const vatValue = vat || (taxHasVat(tax) && typeof amountValue !== "function" ? percentage(amountValue, this.kdvOrani) : 0);
    this.setTax(tax, rate, amountValue, vatValue);
    return this;
  }

  public prepare(parent: { faturaTipi?: string }): this {
    this.kdvTutari += this.totalTaxVat();

    if (parent.faturaTipi === InvoiceType.Tevkifat && this.tevkifatKodu) {
      if (!getTaxCodes(TaxEnum.KDVTevkifat)[String(this.tevkifatKodu)]) {
        throw new ValidationError("Geçerli bir Tevkifat Kodu belirtilmeli.", this);
      }
      const rate = getTaxRateByCode(TaxEnum.KDVTevkifat, this.tevkifatKodu);
      if (rate !== false) {
        this.addTax(TaxEnum.KDVTevkifat, rate);
      }
    }

    if (parent.faturaTipi === InvoiceType.OzelMatrah && this.ozelMatrahNedeni) {
      if (!getInvoiceTypeReasons(InvoiceType.OzelMatrah)[String(this.ozelMatrahNedeni)]) {
        throw new ValidationError("Geçerli bir Özel Matrah nedeni belirtilmeli.", this);
      }
      this.kdvTutari = percentage(this.ozelMatrahTutari, this.kdvOrani) + this.totalTaxVat();
    }

    if (parent.faturaTipi === InvoiceType.Istisna && this.gtip && !FormatValidator.gtipCode(this.gtip)) {
      throw new FormatError("GTIP 12 hane olmak zorunda.", this);
    }

    this.calculateTaxes();
    return this;
  }

  public getTotals(): Record<string, number> {
    return {
      birimFiyat: this.birimFiyat,
      ...mapWithAmountFormat({
        fiyat: this.fiyat,
        iskontoTutari: this.iskontoTutari,
        malHizmetTutari: this.malHizmetTutari,
        kdvTutari: this.kdvTutari,
        ozelMatrahTutari: this.ozelMatrahTutari,
      }),
    };
  }

  public export(): Record<string, unknown> {
    return applyKeyMap(
      {
        ...this.toArray(),
        ...this.getTotals(),
        ...this.exportTaxes(),
        birim: this.birim,
      },
      keyMap,
    );
  }
}
