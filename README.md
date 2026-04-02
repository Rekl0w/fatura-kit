# `@rekl0w/fatura-kit`

`@rekl0w/fatura-kit`, GİB e-Arşiv Portal akışları için hazırlanmış **hibrit** bir npm paketidir: hem tipli TypeScript istemcisi sunar, hem de stdio üzerinden çalışan bir MCP sunucusu sağlar.

Bu projenin iki ana referansı vardır:

- [`mlevent/fatura`](https://github.com/mlevent/fatura)
- [`f/fatura`](https://github.com/f/fatura)

Bu paket iki katman sunar:

- **Typed client**: GİB e-Arşiv Portal işlemleri için programatik istemci
- **MCP server**: stdio üzerinden araçlarını LLM istemcilerine açan sunucu

Yani tek paketle hem uygulama içinde SDK gibi kullanabilir, hem de MCP istemcilerine araç servisi olarak bağlayabilirsiniz.

> ⚠️ Bu paket vergiye tabi mali veri üretimine aracılık edebilir. Risk kullanıcıya aittir. Üretimde dikkatli kullanın.

## Neler var?

- GİB test/prod login ve token yönetimi
- Taslak belge oluşturma / güncelleme / silme
- e-Fatura, e-Müstahsil, e-SMM model aileleri
- Belge listeleme, filtreleme, tek belge getirme, son belgeyi getirme
- HTML görüntüleme, download URL üretme, ZIP’i diske kaydetme
- SMS ile imzalama akışı
- Profil bilgisi okuma/güncelleme
- Mükellef sorgulama
- İptal / itiraz talebi oluşturma
- Vergi, birim, para birimi ve belge katalogları
- Upstream parity odaklı model/test kapsamı

## Kurulum

```bash
bun add @rekl0w/fatura-kit
```

veya

```bash
npm install @rekl0w/fatura-kit
```

## Kimler için?

- MCP kullanan editör/agent entegrasyonları
- Node.js / Bun projelerinde doğrudan SDK isteyen geliştiriciler
- GİB portal akışlarını script veya back-end servis içinde otomatikleştirmek isteyen ekipler

## MCP olarak kullanma

### VS Code / MCP client komutu

```json
{
  "mcpServers": {
    "fatura": {
      "command": "npx",
      "args": ["-y", "@rekl0w/fatura-kit"]
    }
  }
}
```

Bun ile yerel geliştirme sırasında:

```json
{
  "mcpServers": {
    "fatura": {
      "command": "bun",
      "args": ["run", "src/cli.ts"],
      "cwd": "/absolute/path/to/project"
    }
  }
}
```

## Sağlanan MCP araçları

- `session_login`
- `session_logout`
- `session_set_token`
- `session_set_document_type`
- `session_get_phone_number`
- `session_status`
- `document_create_draft`
- `document_list`
- `document_list_received`
- `document_last_id`
- `document_get`
- `document_get_last`
- `document_delete_draft`
- `document_get_html`
- `document_get_download_url`
- `document_save_zip`
- `signing_start_sms`
- `signing_complete_sms`
- `profile_get`
- `profile_update`
- `recipient_lookup`
- `request_list`
- `request_cancellation`
- `request_objection`
- `catalog_list`
- `document_calculate_preview`

## İstemci olarak kullanma

```ts
import { GibClient, DocumentType, InvoiceModel, InvoiceItemModel, Unit } from "@rekl0w/fatura-kit";

const client = new GibClient({ documentType: DocumentType.Invoice });
await client.setTestCredentials("33333310", "1");
await client.login();

const invoice = InvoiceModel.create({
  vknTckn: "11111111111",
  aliciAdi: "Mert",
  aliciSoyadi: "Levent",
  mahalleSemtIlce: "Nilüfer",
  sehir: "Bursa",
  ulke: "Türkiye",
});

invoice.addItem(
  new InvoiceItemModel({
    malHizmet: "Çimento",
    miktar: 3,
    birim: Unit.M3,
    birimFiyat: 1259,
    kdvOrani: 18,
  }),
);

await client.createDraft(invoice);
```

## npm paketi olarak neler export ediyor?

Paket ana girişinden şunları kullanabilirsiniz:

- `GibClient`
- model sınıfları (`InvoiceModel`, `ProducerReceiptModel`, `SelfEmployedReceiptModel`, vb.)
- enum katalogları (`DocumentType`, `InvoiceType`, `Tax`, `Unit`, `Currency`, vb.)
- MCP sunucusu kurmak için `createFaturaMcpServer`

CLI tarafı ayrı export olarak da erişilebilir:

```ts
import "@rekl0w/fatura-kit/cli";
```

## Geliştirme

```bash
bun install
bun test
bun run typecheck
bun run lint
bun run build
```

## Ortam değişkenleri

Repo içinde örnek olarak şu dosyalar hazır gelir:

- `.env`
- `.env.example`

Desteklenen placeholder anahtarlar:

- `GIB_TEST_USERNAME`
- `GIB_TEST_PASSWORD`
- `GIB_PROD_USERNAME`
- `GIB_PROD_PASSWORD`

Varsayılan test suite gerçek GİB’e gitmez; fixture ve mock transport kullanır.

## Test kapsamı

Paket, upstream `mlevent/fatura` testlerinden türetilen ve genişletilen parity testleri içerir:

- invoice tax math
- invoice total math
- producer receipt total math
- credential lifecycle
- list/get/update/delete service akışları
- self-employed receipt math
- tevkifat / özel matrah / istisna senaryoları
- sms / html / download / request akışları

## Yayınlama

npm’e yayın için temel akış hazır:

```bash
bun run check
bun run build
npm publish --access public
```

GitHub Actions tarafında da CI ve publish workflow dosyaları eklenmiştir.

## Sürümleme yaklaşımı

- `CHANGELOG.md` kullanıcıya dönük değişiklikleri özetler
- parity bozan davranış değişiklikleri major/minor notuyla açık yazılmalıdır
- upstream referansına yaklaşan düzeltmeler changelog’da özellikle belirtilmelidir

## Komutlar

```bash
bun run test
bun run typecheck
bun run lint
bun run build
bun run check
```

## Katkı

Katkı akışı için `CONTRIBUTING.md` dosyasına bakın. Kısa kural: parity’yi bozmadan ilerle, test ekle, sonra refactor et.

## Lisans

MIT
