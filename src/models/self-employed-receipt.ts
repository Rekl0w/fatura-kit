import { Currency } from "../enums";
import { ValidationError } from "../errors";
import { arrayColumnSumWithAmountFormat, applyKeyMap, mapWithAmountFormat } from "../utils";
import { BaseDocument } from "./base-document";
import { asArray, asBoolean, asNumber, asString } from "./helpers";
import { SelfEmployedReceiptItemModel, type SelfEmployedReceiptItemFields } from "./self-employed-receipt-item";
import type { ModelMeta } from "./types";

export type SelfEmployedReceiptModelFields = {
  vknTckn: string;
  uuid?: string;
  belgeNumarasi?: string;
  tarih?: string;
  saat?: string;
  paraBirimi?: typeof Currency[keyof typeof Currency];
  dovizKuru?: number;
  aliciUnvan?: string;
  aliciAdi?: string;
  aliciSoyadi?: string;
  adres?: string;
  binaAdi?: string;
  binaNo?: string;
  kapiNo?: string;
  kasabaKoy?: string;
  mahalleSemtIlce?: string;
  sehir?: string;
  ulke?: string;
  postaKodu?: string;
  vergiDairesi?: string;
  aciklama?: string;
  kdvTahakkukIcin?: boolean;
  malHizmetListe?: Array<Record<string, unknown>>;
  brutUcret?: number;
  gvStopajTutari?: number;
  netUcretTutari?: number;
  kdvTutari?: number;
  kdvTevkifatTutari?: number;
  tahsilEdilenKdv?: number;
  netAlinanToplam?: number;
  xxx?: number;
};

const keyMap = {
  uuid: "ettn",
  aliciAdi: "adi",
  aliciSoyadi: "soyadi",
  aliciUnvan: "unvan",
  adres: "bulvarCaddeSokak",
  malHizmetListe: "serbestTable",
  dovizKuru: "kur",
  brutUcret: "brtUcret",
  gvStopajTutari: "gvStpjTtari",
  netUcretTutari: "netUcretTtr",
  kdvTutari: "kdvTtri",
  kdvTevkifatTutari: "kdvTvkftTtri",
  tahsilEdilenKdv: "thsilEdilenKdv",
};

export class SelfEmployedReceiptModel extends BaseDocument<SelfEmployedReceiptItemModel> {
  public vknTckn: string;
  public belgeNumarasi: string;
  public paraBirimi: typeof Currency[keyof typeof Currency];
  public dovizKuru: number;
  public aliciUnvan: string;
  public aliciAdi: string;
  public aliciSoyadi: string;
  public adres: string;
  public binaAdi: string;
  public binaNo: string;
  public kapiNo: string;
  public kasabaKoy: string;
  public mahalleSemtIlce: string;
  public sehir: string;
  public ulke: string;
  public postaKodu: string;
  public vergiDairesi: string;
  public aciklama: string;
  public kdvTahakkukIcin: boolean;
  public brutUcret: number;
  public gvStopajTutari: number;
  public netUcretTutari: number;
  public kdvTutari: number;
  public kdvTevkifatTutari: number;
  public tahsilEdilenKdv: number;
  public netAlinanToplam: number;
  public xxx: number;

  constructor(fields: SelfEmployedReceiptModelFields, meta: ModelMeta = {}) {
    super(meta);
    this.vknTckn = asString(fields.vknTckn);
    this.uuid = asString(fields.uuid);
    this.belgeNumarasi = asString(fields.belgeNumarasi);
    this.tarih = asString(fields.tarih);
    this.saat = asString(fields.saat);
    this.paraBirimi = fields.paraBirimi ?? Currency.TRY;
    this.dovizKuru = asNumber(fields.dovizKuru);
    this.aliciUnvan = asString(fields.aliciUnvan);
    this.aliciAdi = asString(fields.aliciAdi);
    this.aliciSoyadi = asString(fields.aliciSoyadi);
    this.adres = asString(fields.adres);
    this.binaAdi = asString(fields.binaAdi);
    this.binaNo = asString(fields.binaNo);
    this.kapiNo = asString(fields.kapiNo);
    this.kasabaKoy = asString(fields.kasabaKoy);
    this.mahalleSemtIlce = asString(fields.mahalleSemtIlce);
    this.sehir = asString(fields.sehir);
    this.ulke = asString(fields.ulke);
    this.postaKodu = asString(fields.postaKodu);
    this.vergiDairesi = asString(fields.vergiDairesi);
    this.aciklama = asString(fields.aciklama);
    this.kdvTahakkukIcin = asBoolean(fields.kdvTahakkukIcin);
    this.malHizmetListe = asArray(fields.malHizmetListe);
    this.brutUcret = asNumber(fields.brutUcret);
    this.gvStopajTutari = asNumber(fields.gvStopajTutari);
    this.netUcretTutari = asNumber(fields.netUcretTutari);
    this.kdvTutari = asNumber(fields.kdvTutari);
    this.kdvTevkifatTutari = asNumber(fields.kdvTevkifatTutari);
    this.tahsilEdilenKdv = asNumber(fields.tahsilEdilenKdv);
    this.netAlinanToplam = asNumber(fields.netAlinanToplam);
    this.xxx = asNumber(fields.xxx);

    if (this.paraBirimi !== Currency.TRY && !this.dovizKuru) {
      throw new ValidationError("Kur bilgisi belirtilmedi.", fields);
    }

    this.initializeBase();
  }

  public static create(fields: SelfEmployedReceiptModelFields): SelfEmployedReceiptModel {
    return new SelfEmployedReceiptModel(fields);
  }

  public static import(data: Record<string, unknown>): SelfEmployedReceiptModel {
    const mapped = applyKeyMap(data, keyMap, true);
    return new SelfEmployedReceiptModel(mapped as SelfEmployedReceiptModelFields, {
      imported: true,
      importSource: "model",
    });
  }

  public static importFromApi(data: Record<string, unknown>): SelfEmployedReceiptModel {
    const mapped = applyKeyMap(data, keyMap, true);
    return new SelfEmployedReceiptModel(mapped as SelfEmployedReceiptModelFields, {
      imported: true,
      importSource: "api",
    });
  }

  protected itemFactory(data: Record<string, unknown>, source: "fresh" | "model" | "api"): SelfEmployedReceiptItemModel {
    return source === "model"
      ? SelfEmployedReceiptItemModel.import(data)
      : new SelfEmployedReceiptItemModel(data as SelfEmployedReceiptItemFields);
  }

  protected keyMap(): Record<string, string> {
    return keyMap;
  }

  public addItem(...items: SelfEmployedReceiptItemModel[]): this {
    this.setItemsInternal(items);
    return this;
  }

  protected calculateTotals(): void {
    const items = this.getItems(false) as SelfEmployedReceiptItemModel[];
    this.brutUcret = arrayColumnSumWithAmountFormat(items, "brutUcret");
    this.gvStopajTutari = arrayColumnSumWithAmountFormat(items, "gvStopajTutari");
    this.netUcretTutari = arrayColumnSumWithAmountFormat(items, "netUcret");
    this.kdvTutari = arrayColumnSumWithAmountFormat(items, "kdvTutari");
    this.kdvTevkifatTutari = arrayColumnSumWithAmountFormat(items, "kdvTevkifatTutari");
    this.netAlinanToplam = arrayColumnSumWithAmountFormat(items, "netAlinan");
    this.tahsilEdilenKdv = this.kdvTutari - this.kdvTevkifatTutari;
  }

  public getTotals(): Record<string, number> {
    return mapWithAmountFormat({
      brutUcret: this.brutUcret,
      netUcretTutari: this.netUcretTutari,
      gvStopajTutari: this.gvStopajTutari,
      kdvTutari: this.kdvTutari,
      kdvTevkifatTutari: this.kdvTevkifatTutari,
      tahsilEdilenKdv: this.tahsilEdilenKdv,
      netAlinanToplam: this.netAlinanToplam,
    });
  }

  public getPaymentTotal(): number {
    return this.netAlinanToplam;
  }

  public setNote(note: string): this {
    this.aciklama = note;
    return this;
  }

  public export(): Record<string, unknown> {
    return applyKeyMap(
      {
        vknTckn: this.vknTckn,
        uuid: this.uuid,
        belgeNumarasi: this.belgeNumarasi,
        tarih: this.tarih,
        saat: this.saat,
        paraBirimi: this.paraBirimi,
        dovizKuru: this.dovizKuru,
        aliciUnvan: this.aliciUnvan,
        aliciAdi: this.aliciAdi,
        aliciSoyadi: this.aliciSoyadi,
        adres: this.adres,
        binaAdi: this.binaAdi,
        binaNo: this.binaNo,
        kapiNo: this.kapiNo,
        kasabaKoy: this.kasabaKoy,
        mahalleSemtIlce: this.mahalleSemtIlce,
        sehir: this.sehir,
        ulke: this.ulke,
        postaKodu: this.postaKodu,
        vergiDairesi: this.vergiDairesi,
        aciklama: this.aciklama,
        kdvTahakkukIcin: this.kdvTahakkukIcin,
        malHizmetListe: this.getItems(true),
        ...this.getTotals(),
        xxx: this.xxx,
      },
      keyMap,
    );
  }
}
