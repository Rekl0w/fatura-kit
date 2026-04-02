import { Tax as TaxEnum, type Tax, Unit, taxFromCode } from "../enums";
import { percentage, mapWithAmountFormat } from "../utils";
import { BaseItem } from "./base-item";
import { asNumber, asString } from "./helpers";
import type { ModelMeta } from "./types";

export type ProducerReceiptItemFields = {
  malHizmet: string;
  miktar: number;
  birimFiyat: number;
  birim?: typeof Unit[keyof typeof Unit];
  malHizmetTutari?: number;
  gvStopajOrani?: number;
};

export class ProducerReceiptItemModel extends BaseItem {
  public malHizmet: string;
  public miktar: number;
  public birimFiyat: number;
  public birim: typeof Unit[keyof typeof Unit];
  public malHizmetTutari: number;
  public gvStopajOrani: number;

  constructor(fields: ProducerReceiptItemFields, meta: ModelMeta = {}) {
    super(meta);
    this.malHizmet = asString(fields.malHizmet);
    this.miktar = asNumber(fields.miktar);
    this.birimFiyat = asNumber(fields.birimFiyat);
    this.birim = fields.birim ?? Unit.Adet;
    this.malHizmetTutari = asNumber(fields.malHizmetTutari);
    this.gvStopajOrani = asNumber(fields.gvStopajOrani);

    if (!this.imported) {
      this.malHizmetTutari = this.malHizmetTutari || this.miktar * this.birimFiyat;
      this.addTax(TaxEnum.GVStopaj, this.gvStopajOrani);
    }
  }

  public static import(data: Record<string, unknown>): ProducerReceiptItemModel {
    const item = new ProducerReceiptItemModel({
      malHizmet: asString(data.malHizmet),
      miktar: asNumber(data.miktar),
      birimFiyat: asNumber(data.birimFiyat),
      birim: (data.birim as typeof Unit[keyof typeof Unit]) ?? Unit.Adet,
      malHizmetTutari: asNumber(data.malHizmetTutari),
      gvStopajOrani: asNumber(data.gvStopajOrani),
    }, { imported: true, importSource: "model" });

    item.importTaxes(data);
    return item;
  }

  public static importFromApi(data: Record<string, unknown>): ProducerReceiptItemModel {
    const item = new ProducerReceiptItemModel(
      {
        malHizmet: asString(data.malHizmet),
        miktar: asNumber(data.miktar),
        birimFiyat: asNumber(data.birimFiyat),
        birim: (data.birim as typeof Unit[keyof typeof Unit]) ?? Unit.Adet,
        malHizmetTutari: asNumber(data.malHizmetTutari),
        gvStopajOrani: asNumber(data.gvStopajOrani),
      },
      { imported: true, importSource: "api" },
    );

    item.importTaxes(data);
    return item;
  }

  private importTaxes(data: Record<string, unknown>): void {
    const taxMap = new Map<string, { rate?: number; amount?: number }>();

    for (const [key, value] of Object.entries(data)) {
      const normalized = key[0]?.toUpperCase() === "V" ? key : `${key[0]?.toUpperCase() ?? ""}${key.slice(1)}`;
      const match = normalized.match(/^V(.+?)(Orani|Tutari)$/);
      if (!match) continue;
      const [, code, kind] = match;
      if (!code) continue;
      const current = taxMap.get(code) ?? {};
      if (kind === "Orani") current.rate = asNumber(value);
      if (kind === "Tutari") current.amount = asNumber(value);
      taxMap.set(code, current);
    }

    for (const [code, payload] of taxMap.entries()) {
      const tax = taxFromCode(code);
      if (!tax || typeof payload.rate !== "number") continue;
      this.addTax(tax, payload.rate, payload.amount ?? 0);
    }
  }

  public addTax(tax: Tax, rate: number, amount = 0): this {
    const resolvedAmount =
      amount ||
      (tax === TaxEnum.BorsaTescil
        ? () => percentage(this.malHizmetTutari - this.totalTaxAmount((line) => line.model !== TaxEnum.BorsaTescil), rate)
        : percentage(this.malHizmetTutari, rate));

    this.setTax(tax, rate, resolvedAmount, 0);
    return this;
  }

  public prepare(): this {
    this.calculateTaxes();
    return this;
  }

  public getTotals(): Record<string, number> {
    return {
      birimFiyat: this.birimFiyat,
      ...mapWithAmountFormat({
        malHizmetTutari: this.malHizmetTutari,
      }),
    };
  }

  public export(): Record<string, unknown> {
    return {
      ...this.toArray(),
      ...this.getTotals(),
      ...this.exportTaxes(true),
      birim: this.birim,
    };
  }
}
