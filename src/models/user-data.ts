import { applyKeyMap } from "../utils";
import { asString } from "./helpers";

export type UserDataFields = {
  vknTckn?: string;
  unvan?: string;
  ad?: string;
  soyad?: string;
  cadde?: string;
  apartmanAdi?: string;
  apartmanNo?: string;
  kapiNo?: string;
  kasaba?: string;
  ilce?: string;
  il?: string;
  postaKodu?: string;
  ulke?: string;
  telNo?: string;
  faksNo?: string;
  ePostaAdresi?: string;
  webSitesiAdresi?: string;
  vergiDairesi?: string;
  sicilNo?: string;
  isMerkezi?: string;
  mersisNo?: string;
};

export class UserDataModel {
  public vknTckn: string;
  public unvan: string;
  public ad: string;
  public soyad: string;
  public cadde: string;
  public apartmanAdi: string;
  public apartmanNo: string;
  public kapiNo: string;
  public kasaba: string;
  public ilce: string;
  public il: string;
  public postaKodu: string;
  public ulke: string;
  public telNo: string;
  public faksNo: string;
  public ePostaAdresi: string;
  public webSitesiAdresi: string;
  public vergiDairesi: string;
  public sicilNo: string;
  public isMerkezi: string;
  public mersisNo: string;

  constructor(fields: UserDataFields = {}) {
    this.vknTckn = asString(fields.vknTckn);
    this.unvan = asString(fields.unvan);
    this.ad = asString(fields.ad);
    this.soyad = asString(fields.soyad);
    this.cadde = asString(fields.cadde);
    this.apartmanAdi = asString(fields.apartmanAdi);
    this.apartmanNo = asString(fields.apartmanNo);
    this.kapiNo = asString(fields.kapiNo);
    this.kasaba = asString(fields.kasaba);
    this.ilce = asString(fields.ilce);
    this.il = asString(fields.il);
    this.postaKodu = asString(fields.postaKodu);
    this.ulke = asString(fields.ulke);
    this.telNo = asString(fields.telNo);
    this.faksNo = asString(fields.faksNo);
    this.ePostaAdresi = asString(fields.ePostaAdresi);
    this.webSitesiAdresi = asString(fields.webSitesiAdresi);
    this.vergiDairesi = asString(fields.vergiDairesi);
    this.sicilNo = asString(fields.sicilNo);
    this.isMerkezi = asString(fields.isMerkezi);
    this.mersisNo = asString(fields.mersisNo);
  }

  public static new(fields: UserDataFields = {}): UserDataModel {
    return new UserDataModel(fields);
  }

  public static import(data: Record<string, unknown>): UserDataModel {
    return new UserDataModel(data as UserDataFields);
  }

  public static importFromApi(data: Record<string, unknown>): UserDataModel {
    return new UserDataModel(data as UserDataFields);
  }

  public toArray(): Record<string, unknown> {
    return { ...(this as unknown as Record<string, unknown>) };
  }

  public export(): Record<string, unknown> {
    return applyKeyMap(this.toArray(), {});
  }
}
