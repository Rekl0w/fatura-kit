import { access, realpath, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { DocumentType, ObjectionMethod, Type } from "../enums";
import { ApiError, FormatError, ValidationError } from "../errors";
import type { Exportable } from "../models";
import { UserDataModel } from "../models";
import { applyDocumentQuery, createInitialQueryState, type QueryState } from "../query/document-query";
import { curdate, FormatValidator } from "../utils";
import { PortalHttpClient, type HttpTransport } from "./portal-http-client";

const API = {
  gateways: {
    prod: "https://earsivportal.efatura.gov.tr",
    test: "https://earsivportaltest.efatura.gov.tr",
  },
  paths: {
    esign: "/earsiv-services/esign",
    login: "/earsiv-services/assos-login",
    dispatch: "/earsiv-services/dispatch",
    download: "/earsiv-services/download",
  },
} as const;

function isExportableModel(data: unknown): data is Exportable<Record<string, unknown>> & { getUuid(): string } {
  return typeof data === "object" && data !== null && "export" in data && "getUuid" in data;
}

export type GibClientOptions = {
  documentType?: (typeof DocumentType)[keyof typeof DocumentType];
  testMode?: boolean;
  username?: string | null;
  password?: string | null;
  token?: string | null;
  transport?: HttpTransport;
};

export class GibClient {
  private readonly client: PortalHttpClient;
  private documentType: (typeof DocumentType)[keyof typeof DocumentType];
  private testModeValue: boolean;
  private username: string | null;
  private password: string | null;
  private token: string | null;
  private queryState: QueryState = createInitialQueryState();
  private lastIdValue = "";
  private rowCountValue = 0;

  constructor(options: GibClientOptions = {}) {
    this.documentType = options.documentType ?? DocumentType.Invoice;
    this.testModeValue = options.testMode ?? false;
    this.username = options.username ?? null;
    this.password = options.password ?? null;
    this.token = options.token ?? null;
    this.client = new PortalHttpClient(options.transport);
  }

  public testMode(): this {
    this.testModeValue = true;
    return this;
  }

  public setDocumentType(documentType: (typeof DocumentType)[keyof typeof DocumentType]): this {
    this.documentType = documentType;
    return this;
  }

  public setCredentials(username: string | null = null, password: string | null = null): this {
    this.username = username;
    this.password = password;
    return this;
  }

  public getCredentials(): { username: string | null; password: string | null } {
    return { username: this.username, password: this.password };
  }

  public async setTestCredentials(username?: string, password?: string): Promise<this> {
    if (username && password) {
      return this.testMode().setCredentials(username, password);
    }

    const credentials = await this.getTestCredentials();
    return this.testMode().setCredentials(credentials.username, credentials.password);
  }

  public async getTestCredentials(): Promise<{ username: string; password: string }> {
    const response = (await this.client.requestJson<Record<string, unknown>>(this.getGateway("esign"), {
      assoscmd: "kullaniciOner",
      rtype: "json",
    })) as Record<string, unknown>;

    if (typeof response.userid !== "string" || !response.userid) {
      throw new ApiError("Şu anda sistemdeki tüm test hesapları kullanılıyor.");
    }

    return { username: response.userid, password: "1" };
  }

  public setToken(token: string | null = null): this {
    this.token = token;
    return this;
  }

  public getToken(): string | null {
    return this.token;
  }

  private setUuid(uuid: string | string[]): string | string[] {
    const items = Array.isArray(uuid) ? uuid : [uuid];
    for (const item of items) {
      if (!FormatValidator.uuid(item)) {
        throw new ValidationError("Uuid doğrulanamadı.", item);
      }
    }
    return uuid;
  }

  public async login(username?: string, password?: string): Promise<this> {
    if (username && password) {
      this.setCredentials(username, password);
    }

    const response = await this.client.requestJson<Record<string, unknown>>(this.getGateway("login"), {
      assoscmd: this.testModeValue ? "login" : "anologin",
      userid: this.username ?? "",
      sifre: this.password ?? "",
      sifre2: this.password ?? "",
      parola: this.password ?? "",
    });

    if (typeof response.token !== "string") {
      throw new ApiError("Token alınamadı.", this.getCredentials(), response);
    }

    this.token = response.token;
    return this;
  }

  public async logout(): Promise<boolean> {
    await this.client.requestJson(this.getGateway("login"), {
      assoscmd: "logout",
      token: this.token ?? "",
    });

    this.setCredentials(null, null);
    this.setToken(null);
    return true;
  }

  public async getRecipientData(taxOrTrId: string): Promise<Record<string, unknown>> {
    const response = await this.dispatch("SICIL_VEYA_MERNISTEN_BILGILERI_GETIR", "RG_BASITFATURA", {
      vknTcknn: taxOrTrId,
    });
    return (response.data ?? {}) as Record<string, unknown>;
  }

  public async getUserData(): Promise<Record<string, unknown>> {
    const response = await this.dispatch("EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR", "RG_KULLANICI");
    return (response.data ?? {}) as Record<string, unknown>;
  }

  public async updateUserData(userData: UserDataModel | Record<string, unknown>): Promise<boolean> {
    const payload = userData instanceof UserDataModel ? userData.export() : userData;
    const response = await this.dispatch("EARSIV_PORTAL_KULLANICI_BILGILERI_KAYDET", "RG_KULLANICI", payload);
    return Boolean(response.data);
  }

  public async getPhoneNumber(): Promise<string | null> {
    const response = await this.dispatch("EARSIV_PORTAL_TELEFONNO_SORGULA", "RG_BASITTASLAKLAR");
    const data = response.data as Record<string, unknown> | undefined;
    return typeof data?.telefon === "string" ? data.telefon : null;
  }

  public async startSmsVerification(): Promise<string | null> {
    const phoneNumber = await this.getPhoneNumber();
    if (!phoneNumber) return null;

    const response = await this.dispatch("EARSIV_PORTAL_SMSSIFRE_GONDER", "RG_SMSONAY", {
      CEPTEL: phoneNumber,
      KCEPTEL: false,
      TIP: "",
    });

    const data = response.data as Record<string, unknown> | undefined;
    return typeof data?.oid === "string" ? data.oid : null;
  }

  public async completeSmsVerification(code: string, oid: string, documents: string[]): Promise<boolean> {
    const setToSign = (this.setUuid(documents) as string[]).map((uuid) => ({
      belgeTuru: this.documentType,
      ettn: uuid,
    }));

    const response = await this.dispatch("0lhozfib5410mp", "RG_SMSONAY", {
      DATA: setToSign,
      SIFRE: code,
      OID: oid,
      OPR: 1,
    });

    const data = response.data as Record<string, unknown> | undefined;
    if (String(data?.sonuc ?? "") === "1") {
      this.rowCountValue = documents.length;
      return true;
    }
    return false;
  }

  public async createDraft(data: Exportable<Record<string, unknown>> | Record<string, unknown>): Promise<boolean> {
    let payload = data as Record<string, unknown>;
    if (isExportableModel(data)) {
      this.lastIdValue = data.getUuid();
      payload = data.export();
    }

    const requestPath: [string, string] =
      this.documentType === DocumentType.Invoice
        ? ["EARSIV_PORTAL_FATURA_OLUSTUR", "RG_BASITFATURA"]
        : this.documentType === DocumentType.ProducerReceipt
          ? ["EARSIV_PORTAL_MUSTAHSIL_OLUSTUR", "RG_MUSTAHSIL"]
          : ["EARSIV_PORTAL_SERBEST_MESLEK_MAKBUZU_OLUSTUR", "RG_SERBEST"];

    const response = await this.dispatch(requestPath[0], requestPath[1], payload);
    const message = String(response.data ?? "");
    if (!message.includes("başarıyla")) {
      throw new ApiError(message, payload, response);
    }
    return true;
  }

  public async deleteDraft(documents: string[], reason = "Hatalı İşlem"): Promise<boolean> {
    const setToDelete = (this.setUuid(documents) as string[]).map((uuid) => ({
      belgeTuru: this.documentType,
      ettn: uuid,
    }));

    const response = await this.dispatch("EARSIV_PORTAL_FATURA_SIL", "RG_TASLAKLAR", {
      silinecekler: setToDelete,
      aciklama: reason,
    });

    const match = String(response.data ?? "").match(/(\d+)/);
    if (match) {
      this.rowCountValue = Number.parseInt(match[1]!, 10);
      return true;
    }
    return false;
  }

  public async getDocument(uuid: string): Promise<Record<string, unknown>> {
    const requestPath: [string, string] =
      this.documentType === DocumentType.Invoice
        ? ["EARSIV_PORTAL_FATURA_GETIR", "RG_TASLAKLAR"]
        : this.documentType === DocumentType.ProducerReceipt
          ? ["EARSIV_PORTAL_MUSTAHSIL_GETIR", "RG_MUSTAHSIL"]
          : ["EARSIV_PORTAL_SERBEST_MESLEK_GETIR", "RG_SERBEST"];

    const response = await this.dispatch(requestPath[0], requestPath[1], {
      ettn: this.setUuid(uuid),
    });

    return (response.data ?? {}) as Record<string, unknown>;
  }

  public async getLastDocument(): Promise<Record<string, unknown>> {
    const documents = (await this.onlyCurrent().setLimit(1).sortDesc().getAll(curdate("d/m/Y", "-1 year"), curdate("d/m/Y"))) as Array<Record<string, unknown>>;
    return documents.length ? this.getDocument(String(documents[0]?.ettn ?? "")) : {};
  }

  public async getHtml(uuid: string, signed = true): Promise<unknown> {
    const response = await this.dispatch("EARSIV_PORTAL_FATURA_GOSTER", "RG_TASLAKLAR", {
      ettn: this.setUuid(uuid),
      onayDurumu: signed ? "Onaylandı" : "Onaylanmadı",
    });
    return response.data;
  }

  public getDownloadURL(uuid: string, signed = true): string {
    const params = new URLSearchParams({
      token: this.token ?? "",
      ettn: String(this.setUuid(uuid)),
      onayDurumu: signed ? "Onaylandı" : "Onaylanmadı",
      belgeTip: this.documentType,
      cmd: "EARSIV_PORTAL_BELGE_INDIR",
    });
    return `${this.getGateway("download")}?${params.toString()}`;
  }

  public async saveToDisk(uuid: string, dirName = ".", fileName?: string): Promise<string> {
    let saveDir: string;
    try {
      const targetDir = resolve(dirName ?? ".");
      await access(targetDir);
      const targetStat = await stat(targetDir);
      if (!targetStat.isDirectory()) {
        throw new ValidationError(`Geçersiz dosya yolu: ${dirName}`);
      }
      saveDir = await realpath(targetDir);
    } catch {
      throw new ValidationError(`Geçersiz dosya yolu: ${dirName}`);
    }

    const savePath = join(saveDir, `${fileName ?? uuid}.zip`);
    const binary = await this.client.requestBinary(this.getDownloadURL(uuid));
    await writeFile(savePath, binary);
    return savePath;
  }

  public async cancellationRequest(uuid: string, explanation: string): Promise<string> {
    const response = await this.dispatch("EARSIV_PORTAL_IPTAL_TALEBI_OLUSTUR", "RG_TASLAKLAR", {
      ettn: this.setUuid(uuid),
      onayDurumu: "Onaylandı",
      belgeTuru: this.documentType,
      talepAciklama: explanation,
    });
    return String(response.data ?? "");
  }

  public async objectionRequest(
    uuid: string,
    objectionMethod: (typeof ObjectionMethod)[keyof typeof ObjectionMethod],
    documentId: string,
    documentDate: string,
    explanation: string,
  ): Promise<string> {
    const response = await this.dispatch("EARSIV_PORTAL_ITIRAZ_TALEBI_OLUSTUR", "RG_TASLAKLAR", {
      ettn: this.setUuid(uuid),
      onayDurumu: "Onaylandı",
      belgeTuru: this.documentType,
      itirazYontemi: objectionMethod,
      referansBelgeId: documentId,
      referansBelgeTarihi: documentDate,
      talepAciklama: explanation,
    });
    return String(response.data ?? "");
  }

  public async getRequests(startDate: string, endDate: string): Promise<unknown[]> {
    this.assertDateRange(startDate, endDate);
    const response = await this.dispatch("EARSIV_PORTAL_GELEN_IPTAL_ITIRAZ_TALEPLERINI_GETIR", "RG_IPTALITIRAZTASLAKLAR", {
      baslangic: startDate,
      bitis: endDate,
    });
    return (response.data ?? []) as unknown[];
  }

  public async getAll(startDate: string, endDate: string): Promise<unknown> {
    this.assertDateRange(startDate, endDate);
    const response = await this.dispatch("EARSIV_PORTAL_TASLAKLARI_GETIR", "RG_TASLAKLAR", {
      baslangic: startDate,
      bitis: endDate,
      hangiTip: this.testModeValue ? Type.eArsivDiger : Type.eArsivFatura,
    });
    return this.filterDocuments((response.data ?? []) as Record<string, unknown>[]);
  }

  public async getAllIssuedToMe(startDate: string, endDate: string, hourlySearch = "NONE"): Promise<unknown> {
    this.assertDateRange(startDate, endDate);
    const response = await this.dispatch("EARSIV_PORTAL_ADIMA_KESILEN_BELGELERI_GETIR", "RG_ALICI_TASLAKLAR", {
      baslangic: startDate,
      bitis: endDate,
      hourlySearchInterval: hourlySearch,
    });
    return this.filterDocuments((response.data ?? []) as Record<string, unknown>[]);
  }

  private filterDocuments(documents: Record<string, unknown>[]): unknown {
    const { data, rowCount } = applyDocumentQuery(documents, this.queryState);
    this.rowCountValue = rowCount;
    this.queryState.filters = {};
    this.queryState.limit = [];
    this.queryState.column = [];
    return data;
  }

  public selectColumn(column: string, key?: string): this {
    this.queryState.column = key ? [column, key] : [column];
    return this;
  }

  public setLimit(limit = 0, offset = 0): this {
    this.queryState.limit = limit ? [offset, limit] : [];
    return this;
  }

  public sortAsc(): this {
    this.queryState.sortByDesc = false;
    return this;
  }

  public sortDesc(): this {
    this.queryState.sortByDesc = true;
    return this;
  }

  public rowCount(): number {
    return this.rowCountValue;
  }

  public lastId(): string {
    return this.lastIdValue;
  }

  public onlySigned(): this {
    this.queryState.filters.onayDurumu = "Onaylandı";
    return this;
  }

  public onlyUnsigned(): this {
    this.queryState.filters.onayDurumu = "Onaylanmadı";
    return this;
  }

  public onlyDeleted(): this {
    this.queryState.filters.onayDurumu = "Silinmiş";
    return this;
  }

  public onlyCurrent(): this {
    this.queryState.filters.belgeTuru = this.documentType;
    return this;
  }

  public onlyInvoice(): this {
    this.queryState.filters.belgeTuru = DocumentType.Invoice;
    return this;
  }

  public onlyProducerReceipt(): this {
    this.queryState.filters.belgeTuru = DocumentType.ProducerReceipt;
    return this;
  }

  public onlySelfEmployedReceipt(): this {
    this.queryState.filters.belgeTuru = DocumentType.SelfEmployedReceipt;
    return this;
  }

  public findRecipientName(value: string): this {
    this.queryState.filters.aliciUnvanAdSoyad = value;
    return this;
  }

  public findRecipientId(value: string): this {
    this.queryState.filters.aliciVknTckn = value;
    return this;
  }

  public findDocumentId(value: string): this {
    this.queryState.filters.belgeNumarasi = value;
    return this;
  }

  public findEttn(value: string): this {
    this.queryState.filters.ettn = value;
    return this;
  }

  public getGateway(path: keyof typeof API.paths | string): string {
    if (!(path in API.paths)) {
      throw new ValidationError("Geçersiz path gönderildi.", path);
    }
    return `${this.testModeValue ? API.gateways.test : API.gateways.prod}${API.paths[path as keyof typeof API.paths]}`;
  }

  public setParams(command: [string, string], payload: Record<string, unknown> = {}): Record<string, unknown> {
    const [cmd, pageName] = command;
    return {
      callid: crypto.randomUUID(),
      token: this.token ?? "",
      cmd,
      pageName,
      jp: JSON.stringify(Object.keys(payload).length ? payload : {}),
    };
  }

  private assertDateRange(startDate: string, endDate: string): void {
    if (!FormatValidator.date(startDate) || !FormatValidator.date(endDate)) {
      throw new FormatError("Tarih geçerli formatta değil.");
    }
  }

  private async dispatch(cmd: string, pageName: string, payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.client.requestJson<Record<string, unknown>>(this.getGateway("dispatch"), this.setParams([cmd, pageName], payload));
  }
}
