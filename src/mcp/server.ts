import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Currency, DocumentType, InvoiceType, ObjectionMethod, Tax, Type, Unit, currencyCases, documentTypeCases, getCurrencyAlias, getInvoiceTypeAlias, getInvoiceTypeReasons, getTaxAlias, getTaxCodes, getTaxDefaultRate, getTypeAlias, getUnitAlias, invoiceTypeCases, objectionMethodCases, taxCases, taxHasDefaultRate, taxHasVat, taxIsStoppage, taxIsWithholding, unitCases } from "../enums";
import { GibClient, type GibClientOptions } from "../client/gib-client";
import { InvoiceItemModel, InvoiceModel, InvoiceReturnItem, ProducerReceiptItemModel, ProducerReceiptModel, SelfEmployedReceiptItemModel, SelfEmployedReceiptModel, UserDataModel } from "../models";

type SessionState = {
  testMode: boolean;
  username: string | null;
  password: string | null;
  token: string | null;
  documentType: (typeof DocumentType)[keyof typeof DocumentType];
  lastId: string | null;
};

export type FaturaMcpServerOptions = {
  clientOptions?: Pick<GibClientOptions, "transport">;
};

const documentTypeSchema = z.enum([
  DocumentType.Invoice,
  DocumentType.ProducerReceipt,
  DocumentType.SelfEmployedReceipt,
]);

const objectionMethodSchema = z.enum([
  ObjectionMethod.Noter,
  ObjectionMethod.TaahhutluMektup,
  ObjectionMethod.Telgraf,
  ObjectionMethod.Kep,
]);

function jsonText(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function makeClient(
  session: SessionState,
  options: FaturaMcpServerOptions,
  documentType: GibClientOptions["documentType"] = DocumentType.Invoice,
): GibClient {
  return new GibClient({
    documentType,
    testMode: session.testMode,
    username: session.username,
    password: session.password,
    token: session.token,
    ...(options.clientOptions?.transport ? { transport: options.clientOptions.transport } : {}),
  });
}

function buildPreviewDocument(documentType: string, payload: Record<string, unknown>) {
  if (documentType === DocumentType.Invoice) {
    const invoice = InvoiceModel.create(payload as never);
    if (Array.isArray(payload.malHizmetListe)) {
      invoice.addItem(...payload.malHizmetListe.map((item) => new InvoiceItemModel(item as never)));
    }
    if (Array.isArray(payload.iadeListe)) {
      invoice.addReturnItem(...payload.iadeListe.map((item) => new InvoiceReturnItem(item as never)));
    }
    return invoice;
  }

  if (documentType === DocumentType.ProducerReceipt) {
    const receipt = ProducerReceiptModel.create(payload as never);
    if (Array.isArray(payload.malHizmetListe)) {
      receipt.addItem(...payload.malHizmetListe.map((item) => new ProducerReceiptItemModel(item as never)));
    }
    return receipt;
  }

  const receipt = SelfEmployedReceiptModel.create(payload as never);
  if (Array.isArray(payload.malHizmetListe)) {
    receipt.addItem(...payload.malHizmetListe.map((item) => new SelfEmployedReceiptItemModel(item as never)));
  }
  return receipt;
}

export function createFaturaMcpServer(options: FaturaMcpServerOptions = {}): McpServer {
  const session: SessionState = {
    testMode: false,
    username: null,
    password: null,
    token: null,
    documentType: DocumentType.Invoice,
    lastId: null,
  };

  const server = new McpServer({
    name: "fatura-mcp",
    version: "0.1.0",
  });

  server.tool(
    "session_login",
    "Test veya prod GİB hesabıyla oturum açar ve token’ı saklar.",
    {
      mode: z.enum(["test", "prod"]).default("test"),
      username: z.string().optional(),
      password: z.string().optional(),
      documentType: documentTypeSchema.optional(),
    },
    async ({ mode, username, password, documentType }) => {
      session.testMode = mode === "test";
      session.documentType = documentType ?? session.documentType;
      const client = makeClient(session, options, session.documentType);
      if (mode === "test") {
        await client.setTestCredentials(username, password);
      } else {
        client.setCredentials(username ?? null, password ?? null);
      }
      await client.login();
      session.username = client.getCredentials().username;
      session.password = client.getCredentials().password;
      session.token = client.getToken();
      return jsonText({
        mode,
        username: session.username,
        token: session.token,
        documentType: session.documentType,
      });
    },
  );

  server.tool("session_logout", "Aktif GİB oturumunu kapatır.", {}, async () => {
    const client = makeClient(session, options);
    const result = await client.logout();
    session.token = null;
    session.lastId = null;
    return jsonText({ success: result });
  });

  server.tool(
    "session_set_token",
    "Harici olarak elde edilmiş token’ı oturuma yükler.",
    { token: z.string(), testMode: z.boolean().default(false) },
    async ({ token, testMode }) => {
      session.token = token;
      session.testMode = testMode;
      return jsonText({ success: true, token, documentType: session.documentType });
    },
  );

  server.tool(
    "session_set_document_type",
    "Oturumun varsayılan belge türünü belirler.",
    { documentType: documentTypeSchema },
    async ({ documentType }) => {
      session.documentType = documentType;
      return jsonText({ success: true, documentType });
    },
  );

  server.tool("session_status", "Mevcut oturum durumunu döner.", {}, async () =>
    jsonText({
      testMode: session.testMode,
      username: session.username,
      hasToken: Boolean(session.token),
      documentType: session.documentType,
    }),
  );

  server.tool(
    "document_create_draft",
    "Belge payload’ını GİB’de taslak olarak oluşturur veya günceller.",
    {
      documentType: documentTypeSchema,
      payload: z.record(z.any()),
    },
    async ({ documentType, payload }) => {
      session.documentType = documentType;
      const client = makeClient(session, options, documentType);
      const result = await client.createDraft(payload);
      session.lastId = String(payload.faturaUuid ?? payload.uuid ?? payload.ettn ?? client.lastId() ?? "") || null;
      return jsonText({ success: result, lastId: session.lastId });
    },
  );

  server.tool(
    "document_list",
    "Belirli tarih aralığındaki belgeleri listeler ve temel filtreleri uygular.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      startDate: z.string(),
      endDate: z.string(),
      signedState: z.enum(["all", "signed", "unsigned", "deleted"]).default("all"),
      recipientName: z.string().optional(),
      recipientId: z.string().optional(),
      documentId: z.string().optional(),
      ettn: z.string().optional(),
      selectColumn: z.string().optional(),
      selectKey: z.string().optional(),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().min(0).default(0),
      sort: z.enum(["asc", "desc"]).default("desc"),
    },
    async (args) => {
      const client = makeClient(session, options, args.documentType);
      if (args.signedState === "signed") client.onlySigned();
      if (args.signedState === "unsigned") client.onlyUnsigned();
      if (args.signedState === "deleted") client.onlyDeleted();
      if (args.recipientName) client.findRecipientName(args.recipientName);
      if (args.recipientId) client.findRecipientId(args.recipientId);
      if (args.documentId) client.findDocumentId(args.documentId);
      if (args.ettn) client.findEttn(args.ettn);
      if (args.selectColumn) client.selectColumn(args.selectColumn, args.selectKey);
      if (args.limit) client.setLimit(args.limit, args.offset);
      args.sort === "desc" ? client.sortDesc() : client.sortAsc();
      const data = await client.getAll(args.startDate, args.endDate);
      return jsonText({ rowCount: client.rowCount(), data });
    },
  );

  server.tool(
    "document_list_received",
    "Adıma kesilen belgeleri listeler.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      startDate: z.string(),
      endDate: z.string(),
      hourlySearch: z.string().default("NONE"),
      selectColumn: z.string().optional(),
      selectKey: z.string().optional(),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().min(0).default(0),
      sort: z.enum(["asc", "desc"]).default("desc"),
    },
    async ({ documentType, startDate, endDate, hourlySearch, selectColumn, selectKey, limit, offset, sort }) => {
      const client = makeClient(session, options, documentType ?? session.documentType);
      if (selectColumn) client.selectColumn(selectColumn, selectKey);
      if (limit) client.setLimit(limit, offset);
      sort === "desc" ? client.sortDesc() : client.sortAsc();
      const data = await client.getAllIssuedToMe(startDate, endDate, hourlySearch);
      return jsonText({ rowCount: client.rowCount(), data });
    },
  );

  server.tool(
    "document_last_id",
    "Son create/update işleminde kullanılan UUID bilgisini döner.",
    { documentType: documentTypeSchema.default(DocumentType.Invoice) },
    async ({ documentType }) => {
      session.documentType = documentType ?? session.documentType;
      return jsonText({ lastId: session.lastId });
    },
  );

  server.tool(
    "document_get",
    "UUID ile tek bir belge detayını getirir.",
    { documentType: documentTypeSchema.default(DocumentType.Invoice), uuid: z.string() },
    async ({ documentType, uuid }) => {
      const client = makeClient(session, options, documentType);
      return jsonText(await client.getDocument(uuid));
    },
  );

  server.tool(
    "document_get_last",
    "Aktif belge türünde oluşturulan son belgeyi getirir.",
    { documentType: documentTypeSchema.default(DocumentType.Invoice) },
    async ({ documentType }) => {
      const client = makeClient(session, options, documentType);
      return jsonText(await client.getLastDocument());
    },
  );

  server.tool(
    "document_delete_draft",
    "Taslak belgeleri UUID listesiyle siler.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      uuids: z.array(z.string()).min(1),
      reason: z.string().default("Hatalı İşlem"),
    },
    async ({ documentType, uuids, reason }) => {
      const client = makeClient(session, options, documentType);
      const success = await client.deleteDraft(uuids, reason);
      return jsonText({ success, rowCount: client.rowCount() });
    },
  );

  server.tool(
    "document_get_html",
    "Belgenin HTML çıktısını döner.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      uuid: z.string(),
      signed: z.boolean().default(true),
    },
    async ({ documentType, uuid, signed }) => {
      const client = makeClient(session, options, documentType);
      return jsonText({ html: await client.getHtml(uuid, signed) });
    },
  );

  server.tool(
    "document_get_download_url",
    "Belgenin indirilebilir ZIP URL’sini döner.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      uuid: z.string(),
      signed: z.boolean().default(true),
    },
    async ({ documentType, uuid, signed }) => {
      const client = makeClient(session, options, documentType);
      return jsonText({ url: client.getDownloadURL(uuid, signed) });
    },
  );

  server.tool(
    "document_save_zip",
    "Belge ZIP çıktısını disk üzerine yazar.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      uuid: z.string(),
      dirName: z.string().default("."),
      fileName: z.string().optional(),
    },
    async ({ documentType, uuid, dirName, fileName }) => {
      const client = makeClient(session, options, documentType);
      return jsonText({ path: await client.saveToDisk(uuid, dirName, fileName) });
    },
  );

  server.tool(
    "signing_start_sms",
    "SMS ile imzalama için operasyon ID başlatır.",
    { documentType: documentTypeSchema.default(DocumentType.Invoice) },
    async ({ documentType }) => {
      const client = makeClient(session, options, documentType);
      return jsonText({ operationId: await client.startSmsVerification() });
    },
  );

  server.tool(
    "signing_complete_sms",
    "SMS kodu ve operasyon ID ile belgeleri imzalar.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      code: z.string(),
      oid: z.string(),
      uuids: z.array(z.string()).min(1),
    },
    async ({ documentType, code, oid, uuids }) => {
      const client = makeClient(session, options, documentType);
      const success = await client.completeSmsVerification(code, oid, uuids);
      return jsonText({ success, rowCount: client.rowCount() });
    },
  );

  server.tool("profile_get", "GİB profil bilgilerini getirir.", {}, async () => {
    const client = makeClient(session, options);
    return jsonText(await client.getUserData());
  });

  server.tool("session_get_phone_number", "Portalda kayıtlı GSM numarasını getirir.", {}, async () => {
    const client = makeClient(session, options, session.documentType);
    return jsonText({ phoneNumber: await client.getPhoneNumber() });
  });

  server.tool(
    "profile_update",
    "GİB profil bilgilerini günceller.",
    { payload: z.record(z.any()) },
    async ({ payload }) => {
      const client = makeClient(session, options);
      const success = await client.updateUserData(new UserDataModel(payload));
      return jsonText({ success });
    },
  );

  server.tool(
    "recipient_lookup",
    "VKN/TCKN ile mükellef bilgisi sorgular.",
    { identifier: z.string() },
    async ({ identifier }) => {
      const client = makeClient(session, options);
      return jsonText(await client.getRecipientData(identifier));
    },
  );

  server.tool(
    "request_list",
    "İptal/itiraz taleplerini listeler.",
    { startDate: z.string(), endDate: z.string() },
    async ({ startDate, endDate }) => {
      const client = makeClient(session, options);
      return jsonText(await client.getRequests(startDate, endDate));
    },
  );

  server.tool(
    "request_cancellation",
    "İmzalanmış belge için iptal talebi açar.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      uuid: z.string(),
      explanation: z.string(),
    },
    async ({ documentType, uuid, explanation }) => {
      const client = makeClient(session, options, documentType);
      return jsonText({ message: await client.cancellationRequest(uuid, explanation) });
    },
  );

  server.tool(
    "request_objection",
    "İmzalanmış belge için itiraz talebi açar.",
    {
      documentType: documentTypeSchema.default(DocumentType.Invoice),
      uuid: z.string(),
      objectionMethod: objectionMethodSchema,
      documentId: z.string(),
      documentDate: z.string(),
      explanation: z.string(),
    },
    async ({ documentType, uuid, objectionMethod, documentId, documentDate, explanation }) => {
      const client = makeClient(session, options, documentType);
      return jsonText({
        message: await client.objectionRequest(uuid, objectionMethod, documentId, documentDate, explanation),
      });
    },
  );

  server.tool(
    "catalog_list",
    "Enum ve katalog verilerini döner.",
    {
      name: z.enum(["documentTypes", "invoiceTypes", "taxes", "units", "currencies", "objectionMethods", "types"]),
    },
    async ({ name }) => {
      const data =
        name === "documentTypes"
          ? documentTypeCases()
          : name === "invoiceTypes"
            ? invoiceTypeCases().map((item) => ({ value: item, alias: getInvoiceTypeAlias(item), reasons: getInvoiceTypeReasons(item) }))
            : name === "taxes"
              ? taxCases().map((item) => ({
                  value: item,
                  alias: getTaxAlias(item),
                  codes: getTaxCodes(item),
                  hasVat: taxHasVat(item),
                  isStoppage: taxIsStoppage(item),
                  isWithholding: taxIsWithholding(item),
                  hasDefaultRate: taxHasDefaultRate(item),
                  defaultRate: getTaxDefaultRate(item) ?? null,
                }))
              : name === "units"
                ? unitCases().map((item) => ({ value: item, alias: getUnitAlias(item) }))
                : name === "currencies"
                  ? currencyCases().map((item) => ({ value: item, alias: getCurrencyAlias(item) }))
                  : name === "objectionMethods"
                    ? objectionMethodCases()
                    : [Type.eArsivFatura, Type.eArsivDiger].map((item) => ({ value: item, alias: getTypeAlias(item) }));

      return jsonText(data);
    },
  );

  server.tool(
    "document_calculate_preview",
    "Belgeyi GİB’e göndermeden önce toplamları ve export payload’ını hesaplar.",
    {
      documentType: documentTypeSchema,
      payload: z.record(z.any()),
    },
    async ({ documentType, payload }) => {
      const document = buildPreviewDocument(documentType, payload);
      return jsonText({ export: document.export(), paymentTotal: document.getPaymentTotal() });
    },
  );

  return server;
}
