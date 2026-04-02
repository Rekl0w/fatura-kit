import {
  Currency,
  InvoiceType,
  Type,
  taxIsStoppage,
  taxIsWithholding,
} from "../enums";
import { ValidationError } from "../errors";
import {
  amountFormat,
  arrayColumnSumWithAmountFormat,
  applyKeyMap,
  mapWithAmountFormat,
} from "../utils";
import { BaseDocument } from "./base-document";
import { asArray, asNumber, asString } from "./helpers";
import { InvoiceItemModel, type InvoiceItemFields } from "./invoice-item";
import { InvoiceReturnItem } from "./invoice-return-item";
import type { ModelMeta } from "./types";

export type InvoiceModelFields = {
  vknTckn: string;
  hangiTip?: (typeof Type)[keyof typeof Type];
  uuid?: string;
  belgeNumarasi?: string;
  tarih?: string;
  saat?: string;
  paraBirimi?: (typeof Currency)[keyof typeof Currency];
  dovizKuru?: number;
  faturaTipi?: (typeof InvoiceType)[keyof typeof InvoiceType];
  siparisNumarasi?: string;
  siparisTarihi?: string;
  irsaliyeNumarasi?: string;
  irsaliyeTarihi?: string;
  fisNo?: string;
  fisTarihi?: string;
  fisSaati?: string;
  fisTipi?: string;
  zRaporNo?: string;
  okcSeriNo?: string;
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
  tel?: string;
  fax?: string;
  eposta?: string;
  websitesi?: string;
  vergiDairesi?: string;
  iadeListe?: Array<Record<string, unknown>>;
  malHizmetListe?: Array<Record<string, unknown>>;
  not?: string;
  matrah?: number;
  malHizmetToplamTutari?: number;
  toplamIskonto?: number;
  hesaplananKdv?: number;
  vergilerToplami?: number;
  vergilerDahilToplamTutar?: number;
  toplamMasraflar?: number;
  odenecekTutar?: number;
};

const keyMap = {
  uuid: "faturaUuid",
  tarih: "faturaTarihi",
  dovizKuru: "dovzTLkur",
  adres: "bulvarcaddesokak",
  iadeListe: "iadeTable",
  malHizmetListe: "malHizmetTable",
  hesaplananKdv: "hesaplanankdv",
  malHizmetToplamTutari: "malhizmetToplamTutari",
};

export class InvoiceModel extends BaseDocument<InvoiceItemModel> {
  public vknTckn: string;
  public hangiTip: (typeof Type)[keyof typeof Type];
  public belgeNumarasi: string;
  public paraBirimi: (typeof Currency)[keyof typeof Currency];
  public dovizKuru: number;
  public faturaTipi: (typeof InvoiceType)[keyof typeof InvoiceType];
  public siparisNumarasi: string;
  public siparisTarihi: string;
  public irsaliyeNumarasi: string;
  public irsaliyeTarihi: string;
  public fisNo: string;
  public fisTarihi: string;
  public fisSaati: string;
  public fisTipi: string;
  public zRaporNo: string;
  public okcSeriNo: string;
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
  public tel: string;
  public fax: string;
  public eposta: string;
  public websitesi: string;
  public vergiDairesi: string;
  public iadeListe: Array<Record<string, unknown>>;
  public not: string;
  public matrah: number;
  public malHizmetToplamTutari: number;
  public toplamIskonto: number;
  public hesaplananKdv: number;
  public vergilerToplami: number;
  public vergilerDahilToplamTutar: number;
  public toplamMasraflar: number;
  public odenecekTutar: number;

  constructor(fields: InvoiceModelFields, meta: ModelMeta = {}) {
    super(meta);
    this.vknTckn = asString(fields.vknTckn);
    this.hangiTip = fields.hangiTip ?? Type.eArsivFatura;
    this.uuid = asString(fields.uuid);
    this.belgeNumarasi = asString(fields.belgeNumarasi);
    this.tarih = asString(fields.tarih);
    this.saat = asString(fields.saat);
    this.paraBirimi = fields.paraBirimi ?? Currency.TRY;
    this.dovizKuru = asNumber(fields.dovizKuru);
    this.faturaTipi = fields.faturaTipi ?? InvoiceType.Satis;
    this.siparisNumarasi = asString(fields.siparisNumarasi);
    this.siparisTarihi = asString(fields.siparisTarihi);
    this.irsaliyeNumarasi = asString(fields.irsaliyeNumarasi);
    this.irsaliyeTarihi = asString(fields.irsaliyeTarihi);
    this.fisNo = asString(fields.fisNo);
    this.fisTarihi = asString(fields.fisTarihi);
    this.fisSaati = asString(fields.fisSaati);
    this.fisTipi = asString(fields.fisTipi);
    this.zRaporNo = asString(fields.zRaporNo);
    this.okcSeriNo = asString(fields.okcSeriNo);
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
    this.tel = asString(fields.tel);
    this.fax = asString(fields.fax);
    this.eposta = asString(fields.eposta);
    this.websitesi = asString(fields.websitesi);
    this.vergiDairesi = asString(fields.vergiDairesi);
    this.iadeListe = asArray(fields.iadeListe);
    this.malHizmetListe = asArray(fields.malHizmetListe);
    this.not = asString(fields.not);
    this.matrah = asNumber(fields.matrah);
    this.malHizmetToplamTutari = asNumber(fields.malHizmetToplamTutari);
    this.toplamIskonto = asNumber(fields.toplamIskonto);
    this.hesaplananKdv = asNumber(fields.hesaplananKdv);
    this.vergilerToplami = asNumber(fields.vergilerToplami);
    this.vergilerDahilToplamTutar = asNumber(fields.vergilerDahilToplamTutar);
    this.toplamMasraflar = asNumber(fields.toplamMasraflar);
    this.odenecekTutar = asNumber(fields.odenecekTutar);

    if (this.paraBirimi !== Currency.TRY && !this.dovizKuru) {
      throw new ValidationError("Kur bilgisi belirtilmedi.", fields);
    }

    this.initializeBase();

    if (this.iadeListe.length && this.faturaTipi === InvoiceType.Iade) {
      this.iadeListe = this.iadeListe.map((item) =>
        new InvoiceReturnItem({
          faturaNo: asString(item.faturaNo),
          duzenlenmeTarihi: asString(item.duzenlenmeTarihi),
        }).toArray(),
      );
    }
  }

  public static create(fields: InvoiceModelFields): InvoiceModel {
    return new InvoiceModel(fields);
  }

  public static import(data: Record<string, unknown>): InvoiceModel {
    const mapped = applyKeyMap(data, keyMap, true);
    return new InvoiceModel(
      {
        vknTckn: asString(mapped.vknTckn),
        hangiTip:
          (mapped.hangiTip as (typeof Type)[keyof typeof Type]) ??
          Type.eArsivFatura,
        uuid: asString(mapped.uuid),
        belgeNumarasi: asString(mapped.belgeNumarasi),
        tarih: asString(mapped.tarih),
        saat: asString(mapped.saat),
        paraBirimi:
          (mapped.paraBirimi as (typeof Currency)[keyof typeof Currency]) ??
          Currency.TRY,
        dovizKuru: asNumber(mapped.dovizKuru),
        faturaTipi:
          (mapped.faturaTipi as (typeof InvoiceType)[keyof typeof InvoiceType]) ??
          InvoiceType.Satis,
        siparisNumarasi: asString(mapped.siparisNumarasi),
        siparisTarihi: asString(mapped.siparisTarihi),
        irsaliyeNumarasi: asString(mapped.irsaliyeNumarasi),
        irsaliyeTarihi: asString(mapped.irsaliyeTarihi),
        fisNo: asString(mapped.fisNo),
        fisTarihi: asString(mapped.fisTarihi),
        fisSaati: asString(mapped.fisSaati),
        fisTipi: asString(mapped.fisTipi),
        zRaporNo: asString(mapped.zRaporNo),
        okcSeriNo: asString(mapped.okcSeriNo),
        aliciUnvan: asString(mapped.aliciUnvan),
        aliciAdi: asString(mapped.aliciAdi),
        aliciSoyadi: asString(mapped.aliciSoyadi),
        adres: asString(mapped.adres),
        binaAdi: asString(mapped.binaAdi),
        binaNo: asString(mapped.binaNo),
        kapiNo: asString(mapped.kapiNo),
        kasabaKoy: asString(mapped.kasabaKoy),
        mahalleSemtIlce: asString(mapped.mahalleSemtIlce),
        sehir: asString(mapped.sehir),
        ulke: asString(mapped.ulke),
        postaKodu: asString(mapped.postaKodu),
        tel: asString(mapped.tel),
        fax: asString(mapped.fax),
        eposta: asString(mapped.eposta),
        websitesi: asString(mapped.websitesi),
        vergiDairesi: asString(mapped.vergiDairesi),
        iadeListe: asArray(mapped.iadeListe),
        malHizmetListe: asArray(mapped.malHizmetListe),
        not: asString(mapped.not),
        matrah: asNumber(mapped.matrah),
        malHizmetToplamTutari: asNumber(mapped.malHizmetToplamTutari),
        toplamIskonto: asNumber(mapped.toplamIskonto),
        hesaplananKdv: asNumber(mapped.hesaplananKdv),
        vergilerToplami: asNumber(mapped.vergilerToplami),
        vergilerDahilToplamTutar: asNumber(mapped.vergilerDahilToplamTutar),
        toplamMasraflar: asNumber(mapped.toplamMasraflar),
        odenecekTutar: asNumber(mapped.odenecekTutar),
      },
      { imported: true, importSource: "model" },
    );
  }

  public static importFromApi(data: Record<string, unknown>): InvoiceModel {
    const mapped = applyKeyMap(data, keyMap, true);
    return new InvoiceModel(
      {
        ...(mapped as InvoiceModelFields),
        paraBirimi:
          (mapped.paraBirimi as (typeof Currency)[keyof typeof Currency]) ??
          Currency.TRY,
        hangiTip:
          (mapped.hangiTip as (typeof Type)[keyof typeof Type]) ??
          Type.eArsivFatura,
        faturaTipi:
          (mapped.faturaTipi as (typeof InvoiceType)[keyof typeof InvoiceType]) ??
          InvoiceType.Satis,
      },
      { imported: true, importSource: "api" },
    );
  }

  protected itemFactory(
    data: Record<string, unknown>,
    source: "fresh" | "model" | "api",
  ): InvoiceItemModel {
    return source === "model"
      ? InvoiceItemModel.import(data)
      : new InvoiceItemModel(data as InvoiceItemFields);
  }

  protected keyMap(): Record<string, string> {
    return keyMap;
  }

  public addItem(...items: InvoiceItemModel[]): this {
    this.setItemsInternal(items);
    return this;
  }

  public addReturnItem(...items: InvoiceReturnItem[]): this {
    if (this.faturaTipi === InvoiceType.Iade) {
      for (const item of items) {
        this.iadeListe.push(item.toArray());
      }
    }
    return this;
  }

  public getReturnItems(): Array<Record<string, unknown>> {
    return this.iadeListe;
  }

  protected calculateTotals(): void {
    const items = this.getItems(false) as InvoiceItemModel[];
    this.malHizmetToplamTutari = arrayColumnSumWithAmountFormat(items, "fiyat");
    this.matrah = arrayColumnSumWithAmountFormat(items, "malHizmetTutari");
    this.hesaplananKdv = arrayColumnSumWithAmountFormat(items, "kdvTutari");
    this.toplamIskonto = Math.abs(
      arrayColumnSumWithAmountFormat(
        items,
        "iskontoTutari",
        (item) => item.iskontoTipi === "İskonto",
      ) -
        arrayColumnSumWithAmountFormat(
          items,
          "iskontoTutari",
          (item) => item.iskontoTipi === "Arttırım",
        ),
    );
    this.vergilerToplami =
      this.hesaplananKdv +
      arrayColumnSumWithAmountFormat(
        this.getTaxes(),
        "amount",
        (tax) => !taxIsStoppage(tax.model),
      );
    this.vergilerDahilToplamTutar = this.matrah + this.vergilerToplami;
    this.odenecekTutar =
      this.vergilerDahilToplamTutar -
      arrayColumnSumWithAmountFormat(
        this.getTaxes(),
        "amount",
        (tax) => taxIsStoppage(tax.model) || taxIsWithholding(tax.model),
      );
  }

  public getTotals(): Record<string, number> {
    return mapWithAmountFormat({
      matrah: this.matrah,
      malHizmetToplamTutari: this.malHizmetToplamTutari,
      toplamIskonto: this.toplamIskonto,
      hesaplananKdv: this.hesaplananKdv,
      vergilerToplami: this.vergilerToplami,
      vergilerDahilToplamTutar: this.vergilerDahilToplamTutar,
      toplamMasraflar: this.toplamMasraflar,
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
        hangiTip: this.hangiTip,
        uuid: this.uuid,
        belgeNumarasi: this.belgeNumarasi,
        tarih: this.tarih,
        saat: this.saat,
        paraBirimi: this.paraBirimi,
        dovizKuru: this.dovizKuru,
        faturaTipi: this.faturaTipi,
        siparisNumarasi: this.siparisNumarasi,
        siparisTarihi: this.siparisTarihi,
        irsaliyeNumarasi: this.irsaliyeNumarasi,
        irsaliyeTarihi: this.irsaliyeTarihi,
        fisNo: this.fisNo,
        fisTarihi: this.fisTarihi,
        fisSaati: this.fisSaati,
        fisTipi: this.fisTipi,
        zRaporNo: this.zRaporNo,
        okcSeriNo: this.okcSeriNo,
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
        tel: this.tel,
        fax: this.fax,
        eposta: this.eposta,
        websitesi: this.websitesi,
        vergiDairesi: this.vergiDairesi,
        iadeListe: this.iadeListe,
        malHizmetListe: this.getItems(true),
        not: this.not,
        ...this.getTotals(),
      },
      keyMap,
    );
  }
}
