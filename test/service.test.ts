import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { GibClient } from "../src/client/gib-client";
import type { TransportRequest, TransportResponse } from "../src/client/portal-http-client";
import { DocumentType, ObjectionMethod, Unit } from "../src/enums";
import {
  InvoiceItemModel,
  InvoiceModel,
  ProducerReceiptItemModel,
  ProducerReceiptModel,
  SelfEmployedReceiptItemModel,
  SelfEmployedReceiptModel,
  UserDataModel,
} from "../src/models";
import documentsFixture from "./fixtures/documents.json";
import userDataFixture from "./fixtures/user-data.json";

function createMockTransport() {
  const documents = structuredClone(documentsFixture) as Array<Record<string, unknown>>;
  const storedInvoices = new Map<string, Record<string, unknown>>();
  const storedProducerReceipts = new Map<string, Record<string, unknown>>();
  const storedSelfEmployedReceipts = new Map<string, Record<string, unknown>>();
  let userData = structuredClone(userDataFixture) as Record<string, unknown>;

  return async <T>(request: TransportRequest): Promise<TransportResponse<T>> => {
    if (request.url.includes("/download?")) {
      return { status: 200, data: new Uint8Array([1, 2, 3, 4]) as T };
    }

    if (request.url.endsWith("/assos-login")) {
      const assoscmd = request.form?.assoscmd;
      if (assoscmd === "logout") {
        return { status: 200, data: { data: true } as T };
      }
      return { status: 200, data: { token: "mock-token" } as T };
    }

    if (request.url.endsWith("/esign")) {
      return { status: 200, data: { userid: "33333310" } as T };
    }

    if (request.url.endsWith("/dispatch")) {
      const cmd = String(request.form?.cmd ?? "");
      const payload = JSON.parse(String(request.form?.jp ?? "{}")) as Record<string, unknown>;

      switch (cmd) {
        case "EARSIV_PORTAL_TASLAKLARI_GETIR":
        case "EARSIV_PORTAL_ADIMA_KESILEN_BELGELERI_GETIR":
          return { status: 200, data: { data: documents } as T };
        case "EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR":
          return { status: 200, data: { data: userData } as T };
        case "EARSIV_PORTAL_KULLANICI_BILGILERI_KAYDET":
          userData = { ...userData, ...payload };
          return { status: 200, data: { data: true } as T };
        case "EARSIV_PORTAL_TELEFONNO_SORGULA":
          return { status: 200, data: { data: { telefon: "5551234567" } } as T };
        case "EARSIV_PORTAL_SMSSIFRE_GONDER":
          return { status: 200, data: { data: { oid: "oid-123" } } as T };
        case "0lhozfib5410mp":
          return { status: 200, data: { data: { sonuc: "1" } } as T };
        case "EARSIV_PORTAL_FATURA_GOSTER":
          return { status: 200, data: { data: "<html>fatura</html>" } as T };
        case "EARSIV_PORTAL_GELEN_IPTAL_ITIRAZ_TALEPLERINI_GETIR":
          return { status: 200, data: { data: [{ ettn: "request-1", durum: "BEKLIYOR" }] } as T };
        case "EARSIV_PORTAL_IPTAL_TALEBI_OLUSTUR":
          return { status: 200, data: { data: "İptal talebi oluşturuldu" } as T };
        case "EARSIV_PORTAL_ITIRAZ_TALEBI_OLUSTUR":
          return { status: 200, data: { data: "İtiraz talebi oluşturuldu" } as T };
        case "EARSIV_PORTAL_FATURA_OLUSTUR": {
          const uuid = String(payload.faturaUuid ?? crypto.randomUUID());
          const stored = { ...payload, faturaUuid: uuid };
          storedInvoices.set(uuid, stored);
          return { status: 200, data: { data: "Belge başarıyla oluşturuldu" } as T };
        }
        case "EARSIV_PORTAL_MUSTAHSIL_OLUSTUR": {
          const uuid = String(payload.uuid ?? crypto.randomUUID());
          const stored = { ...payload, uuid };
          storedProducerReceipts.set(uuid, stored);
          return { status: 200, data: { data: "Belge başarıyla oluşturuldu" } as T };
        }
        case "EARSIV_PORTAL_SERBEST_MESLEK_MAKBUZU_OLUSTUR": {
          const uuid = String(payload.ettn ?? crypto.randomUUID());
          const stored = { ...payload, ettn: uuid };
          storedSelfEmployedReceipts.set(uuid, stored);
          return { status: 200, data: { data: "Belge başarıyla oluşturuldu" } as T };
        }
        case "EARSIV_PORTAL_FATURA_GETIR": {
          const uuid = String(payload.ettn ?? "");
          return { status: 200, data: { data: storedInvoices.get(uuid) ?? {} } as T };
        }
        case "EARSIV_PORTAL_MUSTAHSIL_GETIR": {
          const uuid = String(payload.ettn ?? "");
          return { status: 200, data: { data: storedProducerReceipts.get(uuid) ?? {} } as T };
        }
        case "EARSIV_PORTAL_SERBEST_MESLEK_GETIR": {
          const uuid = String(payload.ettn ?? "");
          return { status: 200, data: { data: storedSelfEmployedReceipts.get(uuid) ?? {} } as T };
        }
        case "EARSIV_PORTAL_FATURA_SIL":
          return { status: 200, data: { data: "1 adet belge silindi" } as T };
        default:
          return { status: 200, data: { data: {} } as T };
      }
    }

    throw new Error(`Unexpected request: ${request.url}`);
  };
}

describe("service parity", () => {
  it("handles credentials, login, and logout", async () => {
    const service = new GibClient({ transport: createMockTransport() });
    service.setCredentials("333333", "666666");
    expect(service.getCredentials()).toEqual({ username: "333333", password: "666666" });

    await service.setTestCredentials();
    await service.login();
    expect(service.getToken()).toBe("mock-token");
    await expect(service.logout()).resolves.toBe(true);
  });

  it("lists documents with upstream summary keys and selectColumn support", async () => {
    const service = new GibClient({ transport: createMockTransport() });
    await service.setTestCredentials("33333310", "1");
    await service.login();

    const documents = (await service.getAll("01/09/2022", "15/09/2022")) as Array<Record<string, unknown>>;
    expect(Array.isArray(documents)).toBe(true);
    expect(Object.keys(documents[0]!)).toEqual([
      "belgeNumarasi",
      "aliciVknTckn",
      "aliciUnvanAdSoyad",
      "belgeTarihi",
      "belgeTuru",
      "onayDurumu",
      "ettn",
    ]);

    const selected = (await service.selectColumn("ettn").getAll("01/09/2022", "15/09/2022")) as string[];
    expect(selected[0]).toBe(String(documents[0]?.ettn));

    const keyed = (await service
      .selectColumn("ettn", "belgeNumarasi")
      .getAllIssuedToMe("01/09/2022", "15/09/2022")) as Record<string, string>;
    expect(keyed.GIB2022000000356).toBe("c4e9e0a2-4788-11ed-bbd4-4ccc6ae28384");
  });

  it("updates user data", async () => {
    const service = new GibClient({ transport: createMockTransport() });
    await service.setTestCredentials("33333310", "1");
    await service.login();

    const userData = UserDataModel.import(await service.getUserData());
    userData.apartmanAdi = "Lale Apartmanı";
    userData.kapiNo = "12";
    userData.vergiDairesi = "Bursa";

    expect(await service.updateUserData(userData)).toBe(true);
    const newData = await service.getUserData();
    expect(newData.apartmanAdi).toBe("Lale Apartmanı");
  });

  it("handles html, download url, saving, phone and sms flows", async () => {
    const service = new GibClient({ transport: createMockTransport(), documentType: DocumentType.Invoice });
    await service.setTestCredentials("33333310", "1");
    await service.login();

    expect(await service.getPhoneNumber()).toBe("5551234567");
    expect(await service.startSmsVerification()).toBe("oid-123");
    expect(await service.completeSmsVerification("123456", "oid-123", [crypto.randomUUID()])).toBe(true);

    const html = await service.getHtml(crypto.randomUUID());
    expect(html).toBe("<html>fatura</html>");

    const url = service.getDownloadURL(crypto.randomUUID());
    expect(url).toContain("EARSIV_PORTAL_BELGE_INDIR");

    const tempDir = await mkdtemp(join(tmpdir(), "fatura-mcp-"));
    const savedPath = await service.saveToDisk(crypto.randomUUID(), tempDir, "document");
    await access(savedPath);
    const content = await readFile(savedPath);
    expect(Array.from(content)).toEqual([1, 2, 3, 4]);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("handles requests, cancellation and objection flows", async () => {
    const service = new GibClient({ transport: createMockTransport(), documentType: DocumentType.Invoice });
    await service.setTestCredentials("33333310", "1");
    await service.login();

    const requests = await service.getRequests("01/09/2022", "15/09/2022");
    expect(requests).toHaveLength(1);
    expect(await service.cancellationRequest(crypto.randomUUID(), "Hatalı belge")).toContain("İptal");
    expect(
      await service.objectionRequest(
        crypto.randomUUID(),
        ObjectionMethod.Kep,
        "GIB2022000000001",
        "01/01/2022",
        "İtiraz açıklaması",
      ),
    ).toContain("İtiraz");
  });

  it("creates, updates, and deletes an invoice draft", async () => {
    const invoice = InvoiceModel.create({
      vknTckn: "11111111111",
      vergiDairesi: "Çekirge VD",
      aliciUnvan: "Levent İnşaat Malzemeleri San. Tic. Ltd. Şti.",
      aliciAdi: "Mert",
      aliciSoyadi: "Levent",
      mahalleSemtIlce: "Nilüfer",
      sehir: "Bursa",
      ulke: "Türkiye",
    });

    invoice.addItem(
      new InvoiceItemModel({
        malHizmet: "Muhtelif Oyuncak",
        miktar: 12,
        birim: Unit.Adet,
        birimFiyat: 124.52,
        kdvOrani: 18,
        iskontoOrani: 33,
      }),
    );

    invoice.addItem(
      new InvoiceItemModel({
        malHizmet: "Muhtelif Kırtasiye",
        miktar: 3,
        birim: Unit.Adet,
        birimFiyat: 17.56,
        kdvOrani: 8,
      }),
    );

    const service = new GibClient({ transport: createMockTransport(), documentType: DocumentType.Invoice });
    await service.setTestCredentials("33333310", "1");
    await service.login();

    expect(await service.createDraft(invoice)).toBe(true);
    expect(service.lastId()).toBe(invoice.getUuid());

    const invoiceData = invoice.export();
    const createdInvoice = await service.getDocument(invoice.getUuid());
    expect(createdInvoice.aliciAdi).toBe(invoiceData.aliciAdi);
    expect(createdInvoice.malhizmetToplamTutari).toBe(invoiceData.malhizmetToplamTutari);
    expect(createdInvoice.matrah).toBe(invoiceData.matrah);
    expect(createdInvoice.toplamIskonto).toBe(invoiceData.toplamIskonto);
    expect(createdInvoice.vergilerDahilToplamTutar).toBe(invoiceData.vergilerDahilToplamTutar);
    expect(createdInvoice.odenecekTutar).toBe(invoiceData.odenecekTutar);

    const imported = InvoiceModel.import({
      ...createdInvoice,
      aliciAdi: "Nureddin",
      aliciSoyadi: "Nebati",
    });

    const updateData = imported.export();
    expect(await service.createDraft(updateData)).toBe(true);
    const updatedInvoice = await service.getDocument(imported.getUuid());
    expect(updatedInvoice.aliciAdi).toBe(updateData.aliciAdi);
    expect(updatedInvoice.aliciSoyadi).toBe(updateData.aliciSoyadi);

    expect(await service.deleteDraft([imported.getUuid()])).toBe(true);
    expect(service.rowCount()).toBe(1);
  });

  it("creates and retrieves producer receipt drafts", async () => {
    const receipt = ProducerReceiptModel.create({
      vknTckn: "11111111111",
      aliciAdi: "Mert",
      aliciSoyadi: "Levent",
    });

    receipt.addItem(
      new ProducerReceiptItemModel({
        malHizmet: "Buğday",
        miktar: 10,
        birimFiyat: 25,
        gvStopajOrani: 10,
      }),
    );

    const service = new GibClient({ transport: createMockTransport(), documentType: DocumentType.ProducerReceipt });
    await service.setTestCredentials("33333310", "1");
    await service.login();

    expect(await service.createDraft(receipt)).toBe(true);
    const created = await service.getDocument(receipt.getUuid());
    expect(created.aliciAdi).toBe("Mert");
  });

  it("creates and retrieves self-employed receipt drafts", async () => {
    const receipt = SelfEmployedReceiptModel.create({
      vknTckn: "11111111111",
      aliciAdi: "Mert",
      aliciSoyadi: "Levent",
    });

    receipt.addItem(
      new SelfEmployedReceiptItemModel({
        neIcinAlindigi: "Danışmanlık",
        brutUcret: 1000,
        kdvOrani: 20,
        gvStopajOrani: 20,
      }),
    );

    const service = new GibClient({ transport: createMockTransport(), documentType: DocumentType.SelfEmployedReceipt });
    await service.setTestCredentials("33333310", "1");
    await service.login();

    expect(await service.createDraft(receipt)).toBe(true);
    const created = await service.getDocument(receipt.getUuid());
    expect(created.adi).toBe("Mert");
  });
});
