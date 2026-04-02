import {
  arrayColumnSumWithAmountFormat,
  applyKeyMap,
  mapWithAmountFormat,
  FormatValidator,
} from "../utils";
import { FormatError } from "../errors";
import { BaseDocument } from "./base-document";
import { asArray, asNumber, asString } from "./helpers";
import {
  ProducerReceiptItemModel,
  type ProducerReceiptItemFields,
} from "./producer-receipt-item";
import type { ModelMeta } from "./types";

export type ProducerReceiptModelFields = {
  vknTckn: string;
  aliciAdi: string;
  aliciSoyadi: string;
  uuid?: string;
  belgeNumarasi?: string;
  tarih?: string;
  saat?: string;
  sehir?: string;
  websitesi?: string;
  malHizmetListe?: Array<Record<string, unknown>>;
  not?: string;
  teslimTarihi?: string;
  malHizmetToplamTutari?: number;
  vergilerDahilToplamTutar?: number;
  odenecekTutar?: number;
};

const keyMap = {
  teslimTarihi: "teslimTarih",
  malHizmetListe: "mustahsilTable",
  malHizmetToplamTutari: "malhizmetToplamTutari",
};

export class ProducerReceiptModel extends BaseDocument<ProducerReceiptItemModel> {
  public vknTckn: string;
  public aliciAdi: string;
  public aliciSoyadi: string;
  public belgeNumarasi: string;
  public sehir: string;
  public websitesi: string;
  public not: string;
  public teslimTarihi: string;
  public malHizmetToplamTutari: number;
  public vergilerDahilToplamTutar: number;
  public odenecekTutar: number;

  constructor(fields: ProducerReceiptModelFields, meta: ModelMeta = {}) {
    super(meta);
    this.vknTckn = asString(fields.vknTckn);
    this.aliciAdi = asString(fields.aliciAdi);
    this.aliciSoyadi = asString(fields.aliciSoyadi);
    this.uuid = asString(fields.uuid);
    this.belgeNumarasi = asString(fields.belgeNumarasi);
    this.tarih = asString(fields.tarih);
    this.saat = asString(fields.saat);
    this.sehir = asString(fields.sehir);
    this.websitesi = asString(fields.websitesi);
    this.malHizmetListe = asArray(fields.malHizmetListe);
    this.not = asString(fields.not);
    this.teslimTarihi = asString(fields.teslimTarihi);
    this.malHizmetToplamTutari = asNumber(fields.malHizmetToplamTutari);
    this.vergilerDahilToplamTutar = asNumber(fields.vergilerDahilToplamTutar);
    this.odenecekTutar = asNumber(fields.odenecekTutar);

    if (this.teslimTarihi && !FormatValidator.date(this.teslimTarihi)) {
      throw new FormatError("Teslim tarihi geçerli formatta değil.", fields);
    }

    this.initializeBase();
  }

  public static create(
    fields: ProducerReceiptModelFields,
  ): ProducerReceiptModel {
    return new ProducerReceiptModel(fields);
  }

  public static import(data: Record<string, unknown>): ProducerReceiptModel {
    const mapped = applyKeyMap(data, keyMap, true);
    return new ProducerReceiptModel(mapped as ProducerReceiptModelFields, {
      imported: true,
      importSource: "model",
    });
  }

  public static importFromApi(
    data: Record<string, unknown>,
  ): ProducerReceiptModel {
    const mapped = applyKeyMap(data, keyMap, true);
    return new ProducerReceiptModel(mapped as ProducerReceiptModelFields, {
      imported: true,
      importSource: "api",
    });
  }

  protected itemFactory(
    data: Record<string, unknown>,
    source: "fresh" | "model" | "api",
  ): ProducerReceiptItemModel {
    return source === "model"
      ? ProducerReceiptItemModel.import(data)
      : new ProducerReceiptItemModel(data as ProducerReceiptItemFields);
  }

  protected keyMap(): Record<string, string> {
    return keyMap;
  }

  public addItem(...items: ProducerReceiptItemModel[]): this {
    this.setItemsInternal(items);
    return this;
  }

  protected calculateTotals(): void {
    const items = this.getItems(false) as ProducerReceiptItemModel[];
    this.malHizmetToplamTutari = arrayColumnSumWithAmountFormat(
      items,
      "malHizmetTutari",
    );
    this.vergilerDahilToplamTutar = this.malHizmetToplamTutari;
    this.odenecekTutar =
      this.vergilerDahilToplamTutar -
      arrayColumnSumWithAmountFormat(this.getTaxes(), "amount");
  }

  public getTotals(): Record<string, number> {
    return mapWithAmountFormat({
      malHizmetToplamTutari: this.malHizmetToplamTutari,
      vergilerDahilToplamTutar: this.vergilerDahilToplamTutar,
      odenecekTutar: this.odenecekTutar,
    });
  }

  public getPaymentTotal(): number {
    return this.odenecekTutar;
  }

  public setNote(note: string): this {
    this.not = note;
    return this;
  }

  public export(): Record<string, unknown> {
    return applyKeyMap(
      {
        vknTckn: this.vknTckn,
        aliciAdi: this.aliciAdi,
        aliciSoyadi: this.aliciSoyadi,
        uuid: this.uuid,
        belgeNumarasi: this.belgeNumarasi,
        tarih: this.tarih,
        saat: this.saat,
        sehir: this.sehir,
        websitesi: this.websitesi,
        malHizmetListe: this.getItems(true),
        not: this.not,
        teslimTarihi: this.teslimTarihi,
        ...this.getTotals(),
      },
      keyMap,
    );
  }
}
