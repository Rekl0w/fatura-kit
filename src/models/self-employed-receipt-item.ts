import { ValidationError } from "../errors";
import { applyKeyMap, mapWithAmountFormat, percentage } from "../utils";
import { BaseItem } from "./base-item";
import { asNumber, asString } from "./helpers";
import type { ModelMeta } from "./types";

export type SelfEmployedReceiptItemFields = {
  neIcinAlindigi: string;
  brutUcret: number;
  kdvOrani: number;
  gvStopajOrani?: number;
  netUcret?: number;
  kdvTevkifatOrani?: number;
  netAlinan?: number;
  gvStopajTutari?: number;
  kdvTutari?: number;
  kdvTevkifatTutari?: number;
};

const keyMap = {
  gvStopajOrani: "stopaj",
  kdvOrani: "kdv",
};

export class SelfEmployedReceiptItemModel extends BaseItem {
  public neIcinAlindigi: string;
  public brutUcret: number;
  public kdvOrani: number;
  public gvStopajOrani: number;
  public netUcret: number;
  public kdvTevkifatOrani: number;
  public netAlinan: number;
  public gvStopajTutari: number;
  public kdvTutari: number;
  public kdvTevkifatTutari: number;

  constructor(fields: SelfEmployedReceiptItemFields, meta: ModelMeta = {}) {
    super(meta);
    this.neIcinAlindigi = asString(fields.neIcinAlindigi);
    this.brutUcret = asNumber(fields.brutUcret);
    this.kdvOrani = asNumber(fields.kdvOrani);
    this.gvStopajOrani = asNumber(fields.gvStopajOrani);
    this.netUcret = asNumber(fields.netUcret);
    this.kdvTevkifatOrani = asNumber(fields.kdvTevkifatOrani);
    this.netAlinan = asNumber(fields.netAlinan);
    this.gvStopajTutari = asNumber(fields.gvStopajTutari);
    this.kdvTutari = asNumber(fields.kdvTutari);
    this.kdvTevkifatTutari = asNumber(fields.kdvTevkifatTutari);

    if (![0, 1, 8, 10, 18, 20].includes(this.kdvOrani)) {
      throw new ValidationError("Geçersiz KDV oranı.", fields);
    }

    if (!this.imported) {
      this.gvStopajTutari = this.gvStopajTutari || percentage(this.brutUcret, this.gvStopajOrani);
      this.netUcret = this.netUcret || this.brutUcret - this.gvStopajTutari;
      this.kdvTutari = this.kdvTutari || percentage(this.brutUcret, this.kdvOrani);
      this.kdvTevkifatTutari =
        this.kdvTevkifatTutari || percentage(this.kdvTutari, this.kdvTevkifatOrani);
      this.netAlinan = this.netAlinan || this.netUcret + this.kdvTutari - this.kdvTevkifatTutari;
    }
  }

  public static import(data: Record<string, unknown>): SelfEmployedReceiptItemModel {
    return new SelfEmployedReceiptItemModel({
      neIcinAlindigi: asString(data.neIcinAlindigi),
      brutUcret: asNumber(data.brutUcret),
      kdvOrani: asNumber(data.kdvOrani ?? data.kdv),
      gvStopajOrani: asNumber(data.gvStopajOrani ?? data.stopaj),
      netUcret: asNumber(data.netUcret),
      kdvTevkifatOrani: asNumber(data.kdvTevkifatOrani),
      netAlinan: asNumber(data.netAlinan),
      gvStopajTutari: asNumber(data.gvStopajTutari),
      kdvTutari: asNumber(data.kdvTutari),
      kdvTevkifatTutari: asNumber(data.kdvTevkifatTutari),
    }, { imported: true, importSource: "model" });
  }

  public static importFromApi(data: Record<string, unknown>): SelfEmployedReceiptItemModel {
    return new SelfEmployedReceiptItemModel(
      {
        neIcinAlindigi: asString(data.neIcinAlindigi),
        brutUcret: asNumber(data.brutUcret),
        kdvOrani: asNumber(data.kdvOrani ?? data.kdv),
        gvStopajOrani: asNumber(data.gvStopajOrani ?? data.stopaj),
        netUcret: asNumber(data.netUcret),
        kdvTevkifatOrani: asNumber(data.kdvTevkifatOrani),
        netAlinan: asNumber(data.netAlinan),
        gvStopajTutari: asNumber(data.gvStopajTutari),
        kdvTutari: asNumber(data.kdvTutari),
        kdvTevkifatTutari: asNumber(data.kdvTevkifatTutari),
      },
      { imported: true, importSource: "api" },
    );
  }

  public prepare(): this {
    return this;
  }

  public getTotals(): Record<string, number> {
    return mapWithAmountFormat({
      brutUcret: this.brutUcret,
      netUcret: this.netUcret,
      gvStopajTutari: this.gvStopajTutari,
      kdvTutari: this.kdvTutari,
      kdvTevkifatTutari: this.kdvTevkifatTutari,
      netAlinan: this.netAlinan,
    });
  }

  public export(): Record<string, unknown> {
    return applyKeyMap(
      {
        ...this.toArray(),
        ...this.getTotals(),
      },
      keyMap,
    );
  }
}
