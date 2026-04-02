import { describe, expect, it } from "vitest";
import { InvoiceType, Tax, Unit, taxCases } from "../src/enums";
import {
  InvoiceItemModel,
  InvoiceModel,
  InvoiceReturnItem,
  ProducerReceiptItemModel,
  ProducerReceiptModel,
  SelfEmployedReceiptItemModel,
  SelfEmployedReceiptModel,
} from "../src/models";

describe("model parity", () => {
  it("matches upstream invoice totals with all tax cases", () => {
    const invoice = InvoiceModel.create({
      vknTckn: "",
      aliciAdi: "",
      aliciSoyadi: "",
      mahalleSemtIlce: "",
      sehir: "",
      ulke: "",
    });

    invoice.addItem(
      new InvoiceItemModel({
        malHizmet: "",
        miktar: 2,
        birimFiyat: 10,
        kdvOrani: 18,
        iskontoOrani: 10,
      }).eachWith(taxCases(), (self, tax) => {
        self.addTax(tax, 50);
      }),
    );

    const exported = invoice.export();

    expect(exported.matrah).toBe(18);
    expect(exported.malhizmetToplamTutari).toBe(20);
    expect(exported.hesaplanankdv).toBe(27.54);
    expect(exported.vergilerToplami).toBe(261.54);
    expect(exported.vergilerDahilToplamTutar).toBe(279.54);
    expect(exported.odenecekTutar).toBe(211.77);
  });

  it("matches upstream invoice sample totals", () => {
    const invoice = InvoiceModel.create({
      vknTckn: "",
      aliciAdi: "",
      aliciSoyadi: "",
      mahalleSemtIlce: "",
      sehir: "",
      ulke: "",
    });

    invoice.addItem(
      new InvoiceItemModel({
        malHizmet: "",
        miktar: 444,
        birimFiyat: 0.1261,
        kdvOrani: 8,
        iskontoOrani: 15,
        iskontoTipi: "Arttırım",
      }).addTax(Tax.EnerjiFonu, 12),
    );

    invoice.addItem(
      new InvoiceItemModel({
        malHizmet: "",
        miktar: 123,
        birimFiyat: 1.2352,
        kdvOrani: 18,
        iskontoOrani: 7,
      })
        .addTax(Tax.Damga, 5)
        .addTax(Tax.EnerjiFonu, 9),
    );

    invoice.setNote("İrsaliye Yerine Geçer");
    const exported = invoice.export();

    expect(exported.not).toBe("İrsaliye Yerine Geçer");
    expect(exported.matrah).toBe(205.68);
    expect(exported.malhizmetToplamTutari).toBe(207.92);
    expect(exported.toplamIskonto).toBe(2.24);
    expect(exported.hesaplanankdv).toBe(33.49);
    expect(exported.vergilerToplami).toBe(61);
    expect(exported.vergilerDahilToplamTutar).toBe(266.68);
    expect(exported.odenecekTutar).toBe(266.68);
  });

  it("matches upstream producer receipt totals", () => {
    const receipt = ProducerReceiptModel.create({
      vknTckn: "",
      aliciAdi: "",
      aliciSoyadi: "",
    });

    receipt.addItem(
      new ProducerReceiptItemModel({
        malHizmet: "",
        miktar: 21,
        birimFiyat: 0.2541,
        gvStopajOrani: 20,
      }).addTax(Tax.MeraFonu, 12),
    );

    receipt.addItem(
      new ProducerReceiptItemModel({
        malHizmet: "",
        miktar: 111,
        birimFiyat: 12.221,
        gvStopajOrani: 10,
      })
        .addTax(Tax.MeraFonu, 8)
        .addTax(Tax.BorsaTescil, 11),
    );

    const exported = receipt.export();
    expect(exported.malhizmetToplamTutari).toBe(1361.87);
    expect(exported.vergilerDahilToplamTutar).toBe(1361.87);
    expect(exported.odenecekTutar).toBe(993.63);
  });

  it("supports note generation and explicit units", () => {
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

    invoice.setAutoNote();
    expect(typeof invoice.export().not).toBe("string");
  });

  it("matches self-employed receipt totals", () => {
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
        kdvTevkifatOrani: 50,
      }),
      new SelfEmployedReceiptItemModel({
        neIcinAlindigi: "Eğitim",
        brutUcret: 500,
        kdvOrani: 18,
        gvStopajOrani: 10,
        kdvTevkifatOrani: 20,
      }),
    );

    const exported = receipt.export();
    expect(exported.brtUcret).toBe(1500);
    expect(exported.gvStpjTtari).toBe(250);
    expect(exported.netUcretTtr).toBe(1250);
    expect(exported.kdvTtri).toBe(290);
    expect(exported.kdvTvkftTtri).toBe(118);
    expect(exported.thsilEdilenKdv).toBe(172);
    expect(exported.netAlinanToplam).toBe(1422);
  });

  it("supports return item flows for iade invoices", () => {
    const invoice = InvoiceModel.create({
      vknTckn: "11111111111",
      faturaTipi: InvoiceType.Iade,
      aliciAdi: "Mert",
      aliciSoyadi: "Levent",
      mahalleSemtIlce: "Nilüfer",
      sehir: "Bursa",
      ulke: "Türkiye",
    });

    invoice.addReturnItem(
      InvoiceReturnItem.new({
        faturaNo: "GIB2022000000001",
        duzenlenmeTarihi: "01/01/2022",
      }),
    );

    expect((invoice.export().iadeTable as Array<unknown>).length).toBe(1);
  });

  it("applies tevkifat calculations", () => {
    const invoice = InvoiceModel.create({
      vknTckn: "11111111111",
      faturaTipi: InvoiceType.Tevkifat,
      aliciAdi: "Mert",
      aliciSoyadi: "Levent",
      mahalleSemtIlce: "Nilüfer",
      sehir: "Bursa",
      ulke: "Türkiye",
    });

    invoice.addItem(
      new InvoiceItemModel({
        malHizmet: "Hizmet",
        miktar: 1,
        birimFiyat: 100,
        kdvOrani: 18,
        tevkifatKodu: 601,
      }),
    );

  const exported = invoice.export();
  const firstItem = (exported.malHizmetTable as Array<Record<string, unknown>>)[0]!;
  expect(firstItem.V9015Orani).toBe(40);
  expect(firstItem.V9015Tutari).toBe(7.2);
  expect(exported.odenecekTutar).toBe(110.8);
  });

  it("applies ozel matrah calculations", () => {
    const invoice = InvoiceModel.create({
      vknTckn: "11111111111",
      faturaTipi: InvoiceType.OzelMatrah,
      aliciAdi: "Mert",
      aliciSoyadi: "Levent",
      mahalleSemtIlce: "Nilüfer",
      sehir: "Bursa",
      ulke: "Türkiye",
    });

    invoice.addItem(
      new InvoiceItemModel({
        malHizmet: "Bilet",
        miktar: 1,
        birimFiyat: 100,
        kdvOrani: 18,
        ozelMatrahNedeni: 801,
        ozelMatrahTutari: 50,
      }),
    );

    const exported = invoice.export();
    expect(exported.hesaplanankdv).toBe(9);
    expect(exported.odenecekTutar).toBe(109);
  });

  it("validates gtip for istisna invoices", () => {
    const invoice = InvoiceModel.create({
      vknTckn: "11111111111",
      faturaTipi: InvoiceType.Istisna,
      aliciAdi: "Mert",
      aliciSoyadi: "Levent",
      mahalleSemtIlce: "Nilüfer",
      sehir: "Bursa",
      ulke: "Türkiye",
    });

    expect(() =>
      invoice.addItem(
        new InvoiceItemModel({
          malHizmet: "İhracat",
          miktar: 1,
          birimFiyat: 100,
          kdvOrani: 0,
          gtip: "123",
        }),
      ),
    ).toThrow("GTIP 12 hane olmak zorunda.");
  });

  it("preserves importFromApi safe mode semantics until mutated", () => {
    const imported = InvoiceModel.importFromApi({
      vknTckn: "11111111111",
      faturaUuid: crypto.randomUUID(),
      aliciAdi: "Mert",
      aliciSoyadi: "Levent",
      mahalleSemtIlce: "Nilüfer",
      sehir: "Bursa",
      ulke: "Türkiye",
      malHizmetTable: [
        {
          malHizmet: "API Kalemi",
          miktar: 1,
          birimFiyat: 100,
          kdvOrani: 18,
          fiyat: 100,
          malHizmetTutari: 100,
          kdvTutari: 18,
        },
      ],
      matrah: 100,
      malhizmetToplamTutari: 100,
      hesaplanankdv: 18,
      vergilerToplami: 18,
      vergilerDahilToplamTutar: 118,
      odenecekTutar: 118,
    });

    expect((imported.export().malHizmetTable as Array<unknown>).length).toBe(1);

    imported.addItem(
      new InvoiceItemModel({
        malHizmet: "Yeni Kalem",
        miktar: 1,
        birimFiyat: 10,
        kdvOrani: 18,
      }),
    );

    const exported = imported.export();
    expect((exported.malHizmetTable as Array<unknown>).length).toBe(1);
    expect(exported.matrah).toBe(10);
    expect(exported.odenecekTutar).toBe(11.8);
  });
});
