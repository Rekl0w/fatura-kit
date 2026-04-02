export const Tax = {
  BankaMuameleleri: "BankaMuameleleri",
  KKDFKesintisi: "KKDFKesintisi",
  OTV1Liste: "OTV1Liste",
  OTV2Liste: "OTV2Liste",
  OTV3Liste: "OTV3Liste",
  OTV4Liste: "OTV4Liste",
  OTV3AListe: "OTV3AListe",
  OTV3BListe: "OTV3BListe",
  OTV3CListe: "OTV3CListe",
  Damga: "Damga",
  Damga5035: "Damga5035",
  OzelIletisim: "OzelIletisim",
  OzelIletisim5035: "OzelIletisim5035",
  KDVTevkifat: "KDVTevkifat",
  BSMV4961: "BSMV4961",
  BorsaTescil: "BorsaTescil",
  EnerjiFonu: "EnerjiFonu",
  ElkHavagazTuketim: "ElkHavagazTuketim",
  TRTPayi: "TRTPayi",
  ElkTuketim: "ElkTuketim",
  TKKullanim: "TKKullanim",
  TKRuhsat: "TKRuhsat",
  CevreTemizlik: "CevreTemizlik",
  GVStopaj: "GVStopaj",
  KVStopaj: "KVStopaj",
  MeraFonu: "MeraFonu",
  OTV1ListeTevkifat: "OTV1ListeTevkifat",
  BelOdHalRusum: "BelOdHalRusum",
  Konaklama: "Konaklama",
  SGKPrim: "SGKPrim",
} as const;

export type Tax = (typeof Tax)[keyof typeof Tax];

export type TaxCodeInfo = {
  rate: number;
  name: string;
};

export type TaxDefinition = {
  code: string;
  alias: string;
  hasVat: boolean;
  isStoppage: boolean;
  isWithholding: boolean;
  defaultRate?: number;
  codes?: Record<string, TaxCodeInfo>;
};

const kdvTevkifatCodes: Record<string, TaxCodeInfo> = {
  "601": { rate: 40, name: "Yapım İşleri ile Bu İşlerle Birlikte İfa Edilen Mühendislik-Mimarlık ve Etüt-Proje Hizmetleri [KDVGUT-(I/C-2.1.3.2.1)]" },
  "602": { rate: 90, name: "Etüt, plan-proje, danışmanlık, denetim vb" },
  "603": { rate: 70, name: "Makine, Teçhizat, Demirbaş ve Taşıtlara Ait Tadil, Bakım ve Onarım Hizmetleri [KDVGUT- (I/C-2.1.3.2.3)]" },
  "604": { rate: 50, name: "Yemek servis hizmeti" },
  "605": { rate: 50, name: "Organizasyon hizmeti" },
  "606": { rate: 90, name: "İşgücü temin hizmetleri" },
  "607": { rate: 90, name: "Özel güvenlik hizmeti" },
  "608": { rate: 90, name: "Yapı denetim hizmetleri" },
  "609": { rate: 70, name: "Fason Olarak Yaptırılan Tekstil ve Konfeksiyon İşleri, Çanta ve Ayakkabı Dikim İşleri ve Bu İşlere Aracılık Hizmetleri [KDVGUT-(I/C-2.1.3.2.7)]" },
  "610": { rate: 90, name: "Turistik mağazalara verilen müşteri bulma/ götürme hizmetleri" },
  "611": { rate: 90, name: "Spor kulüplerinin yayın, reklam ve isim hakkı gelirlerine konu işlemleri" },
  "612": { rate: 90, name: "Temizlik Hizmeti [KDVGUT-(I/C-2.1.3.2.10)]" },
  "613": { rate: 90, name: "Çevre, Bahçe ve Bakım Hizmetleri [KDVGUT-(I/C-2.1.3.2.11)]" },
  "614": { rate: 50, name: "Servis taşımacıliğı" },
  "615": { rate: 70, name: "Her Türlü Baskı ve Basım Hizmetleri [KDVGUT-(I/C-2.1.3.2.12)]" },
  "616": { rate: 50, name: "Diğer Hizmetler [KDVGUT-(I/C-2.1.3.2.13)]" },
  "617": { rate: 70, name: "Hurda metalden elde edilen külçe teslimleri" },
  "618": { rate: 70, name: "Hurda Metalden Elde Edilenler Dışındaki Bakır, Çinko, Demir Çelik, Alüminyum ve Kurşun Külçe Teslimi [KDVGUT-(I/C-2.1.3.3.1)]" },
  "619": { rate: 70, name: "Bakir, çinko ve alüminyum ürünlerinin teslimi" },
  "620": { rate: 70, name: "İstisnadan vazgeçenlerin hurda ve atık teslimi" },
  "621": { rate: 90, name: "Metal, plastik, lastik, kauçuk, kâğit ve cam hurda ve atıklardan elde edilen hammadde teslimi" },
  "622": { rate: 90, name: "Pamuk, tiftik, yün ve yapaği ile ham post ve deri teslimleri" },
  "623": { rate: 50, name: "Ağaç ve orman ürünleri teslimi" },
  "624": { rate: 20, name: "Yük Taşımacılığı Hizmeti [KDVGUT-(I/C-2.1.3.2.11)]" },
  "625": { rate: 30, name: "Ticari Reklam Hizmetleri [KDVGUT-(I/C-2.1.3.2.15)]" },
  "626": { rate: 20, name: "Diğer Teslimler [KDVGUT-(I/C-2.1.3.3.7.)]" },
  "627": { rate: 50, name: "Demir-Çelik Ürünlerinin Teslimi [KDVGUT-(I/C-2.1.3.3.8)]" },
  "627-Ex": { rate: 40, name: "Demir-Çelik Ürünlerinin Teslimi [KDVGUT-(I/C-2.1.3.3.8)] (01/11/2022 tarihi öncesi)" },
  "801": { rate: 100, name: "[Tam Tevkifat] Yapım İşleri ile Bu İşlerle Birlikte İfa Edilen Mühendislik-Mimarlık ve Etüt-Proje Hizmetleri[KDVGUT-(I/C-2.1.3.2.1)]" },
  "802": { rate: 100, name: "[Tam Tevkifat] Etüt, Plan-Proje, Danışmanlık, Denetim ve Benzeri Hizmetler[KDVGUT-(I/C-2.1.3.2.2)]" },
  "803": { rate: 100, name: "[Tam Tevkifat] Makine, Teçhizat, Demirbaş ve Taşıtlara Ait Tadil, Bakım ve Onarım Hizmetleri[KDVGUT- (I/C-2.1.3.2.3)]" },
  "804": { rate: 100, name: "[Tam Tevkifat] Yemek Servis Hizmeti[KDVGUT-(I/C-2.1.3.2.4)]" },
  "805": { rate: 100, name: "[Tam Tevkifat] Organizasyon Hizmeti[KDVGUT-(I/C-2.1.3.2.4)]" },
  "806": { rate: 100, name: "[Tam Tevkifat] İşgücü Temin Hizmetleri[KDVGUT-(I/C-2.1.3.2.5)]" },
  "807": { rate: 100, name: "[Tam Tevkifat] Özel Güvenlik Hizmeti[KDVGUT-(I/C-2.1.3.2.5)]" },
  "808": { rate: 100, name: "[Tam Tevkifat] Yapı Denetim Hizmetleri[KDVGUT-(I/C-2.1.3.2.6)]" },
  "809": { rate: 100, name: "[Tam Tevkifat] Fason Olarak Yaptırılan Tekstil ve Konfeksiyon İşleri, Çanta ve Ayakkabı Dikim İşleri ve Bu İşlere Aracılık Hizmetleri[KDVGUT-(I/C-2.1.3.2.7)]" },
  "810": { rate: 100, name: "[Tam Tevkifat] Turistik Mağazalara Verilen Müşteri Bulma/ Götürme Hizmetleri[KDVGUT-(I/C-2.1.3.2.8)]" },
  "811": { rate: 100, name: "[Tam Tevkifat] Spor Kulüplerinin Yayın, Reklâm ve İsim Hakkı Gelirlerine Konu İşlemleri[KDVGUT-(I/C-2.1.3.2.9)]" },
  "812": { rate: 100, name: "[Tam Tevkifat] Temizlik Hizmeti[KDVGUT-(I/C-2.1.3.2.10)]" },
  "813": { rate: 100, name: "[Tam Tevkifat] Çevreve Bahçe Bakım Hizmetleri[KDVGUT-(I/C-2.1.3.2.10)]" },
  "814": { rate: 100, name: "[Tam Tevkifat] Servis Taşımacılığı Hizmeti[KDVGUT-(I/C-2.1.3.2.11)]" },
  "815": { rate: 100, name: "[Tam Tevkifat] Her Türlü Baskı ve Basım Hizmetleri[KDVGUT-(I/C-2.1.3.2.12)]" },
  "816": { rate: 100, name: "[Tam Tevkifat] Hurda Metalden Elde Edilen Külçe Teslimleri[KDVGUT-(I/C-2.1.3.3.1)]" },
  "817": { rate: 100, name: "[Tam Tevkifat] Hurda Metalden Elde Edilenler Dışındaki Bakır, Çinko, Demir Çelik, Alüminyum ve Kurşun Külçe Teslimi [KDVGUT-(I/C-2.1.3.3.1)]" },
  "818": { rate: 100, name: "[Tam Tevkifat] Bakır, Çinko, Alüminyum ve Kurşun Ürünlerinin Teslimi[KDVGUT-(I/C-2.1.3.3.2)]" },
  "819": { rate: 100, name: "[Tam Tevkifat] İstisnadan Vazgeçenlerin Hurda ve Atık Teslimi[KDVGUT-(I/C-2.1.3.3.3)]" },
  "820": { rate: 100, name: "[Tam Tevkifat] Metal, Plastik, Lastik, Kauçuk, Kâğıt ve Cam Hurda ve Atıklardan Elde Edilen Hammadde Teslimi[KDVGUT-(I/C-2.1.3.3.4)]" },
  "821": { rate: 100, name: "[Tam Tevkifat] Pamuk, Tiftik, Yün ve Yapağı İle Ham Post ve Deri Teslimleri[KDVGUT-(I/C-2.1.3.3.5)]" },
  "822": { rate: 100, name: "[Tam Tevkifat] Ağaç ve Orman Ürünleri Teslimi[KDVGUT-(I/C-2.1.3.3.6)]" },
  "823": { rate: 100, name: "[Tam Tevkifat] Yük Taşımacılığı Hizmeti [KDVGUT-(I/C-2.1.3.2.11)]" },
  "824": { rate: 100, name: "[Tam Tevkifat] Ticari Reklam Hizmetleri [KDVGUT-(I/C-2.1.3.2.15)]" },
  "825": { rate: 100, name: "[Tam Tevkifat] Demir-Çelik Ürünlerinin Teslimi [KDVGUT-(I/C-2.1.3.3.8)]" }
};

export const taxDefinitions: Record<Tax, TaxDefinition> = {
  [Tax.BankaMuameleleri]: { code: "0021", alias: "Banka Muameleleri Vergisi", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.KKDFKesintisi]: { code: "0061", alias: "KKDF Kesintisi", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.OTV1Liste]: { code: "0071", alias: "ÖTV 1. Liste", hasVat: true, isStoppage: false, isWithholding: false, defaultRate: 0 },
  [Tax.OTV2Liste]: { code: "9077", alias: "ÖTV 2. Liste", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.OTV3Liste]: { code: "0073", alias: "ÖTV 3. Liste", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.OTV4Liste]: { code: "0074", alias: "ÖTV 4. Liste", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.OTV3AListe]: { code: "0075", alias: "ÖTV 3A Liste", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.OTV3BListe]: { code: "0076", alias: "ÖTV 3B Liste", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.OTV3CListe]: { code: "0077", alias: "ÖTV 3C Liste", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.Damga]: { code: "1047", alias: "Damga Vergisi", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.Damga5035]: { code: "1048", alias: "5035 Sayılı Kanuna Göre Damga Vergisi", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.OzelIletisim]: { code: "4080", alias: "Özel İletişim Vergisi", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.OzelIletisim5035]: { code: "4081", alias: "5035 Sayılı Kanuna Göre Özel İletişim Vergisi", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.KDVTevkifat]: { code: "9015", alias: "KDV Tevkifat", hasVat: false, isStoppage: true, isWithholding: true, codes: kdvTevkifatCodes },
  [Tax.BSMV4961]: { code: "9021", alias: "Banka ve Sigorta Muameleleri Vergisi", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.BorsaTescil]: { code: "8001", alias: "Borsa Tescil Ücreti", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.EnerjiFonu]: { code: "8002", alias: "Enerji Fonu", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.ElkHavagazTuketim]: { code: "4071", alias: "Elektrik Havagaz Tüketim Vergisi", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.TRTPayi]: { code: "8004", alias: "TRT Payı", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.ElkTuketim]: { code: "8005", alias: "Elektrik Tüketim Vergisi", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.TKKullanim]: { code: "8006", alias: "TK Kullanım", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.TKRuhsat]: { code: "8007", alias: "TK Ruhsat", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.CevreTemizlik]: { code: "8008", alias: "Çevre Temizlik Vergisi", hasVat: false, isStoppage: false, isWithholding: false },
  [Tax.GVStopaj]: { code: "0003", alias: "Gelir Vergisi Stopajı", hasVat: false, isStoppage: true, isWithholding: false },
  [Tax.KVStopaj]: { code: "0011", alias: "Kurumlar Vergisi Stopajı", hasVat: false, isStoppage: true, isWithholding: false },
  [Tax.MeraFonu]: { code: "9040", alias: "Mera Fonu", hasVat: false, isStoppage: true, isWithholding: false },
  [Tax.OTV1ListeTevkifat]: { code: "4171", alias: "ÖTV 1. Liste Tevkifat", hasVat: true, isStoppage: false, isWithholding: true, defaultRate: 100 },
  [Tax.BelOdHalRusum]: { code: "9944", alias: "Belediyelere Ödenen Hal Rüsumu", hasVat: true, isStoppage: false, isWithholding: false },
  [Tax.Konaklama]: { code: "0059", alias: "Konaklama Vergisi", hasVat: false, isStoppage: false, isWithholding: false, defaultRate: 2 },
  [Tax.SGKPrim]: { code: "SGK_PRIM", alias: "SGK Prim Kesintisi", hasVat: false, isStoppage: true, isWithholding: false },
};

export function taxCases(): Tax[] {
  return Object.values(Tax);
}

export function getTaxCode(tax: Tax): string {
  return taxDefinitions[tax].code;
}

export function getTaxAlias(tax: Tax): string {
  return taxDefinitions[tax].alias;
}

export function taxHasVat(tax: Tax): boolean {
  return taxDefinitions[tax].hasVat;
}

export function taxIsStoppage(tax: Tax): boolean {
  return taxDefinitions[tax].isStoppage;
}

export function taxIsWithholding(tax: Tax): boolean {
  return taxDefinitions[tax].isWithholding;
}

export function taxHasDefaultRate(tax: Tax): boolean {
  return typeof taxDefinitions[tax].defaultRate === "number";
}

export function getTaxDefaultRate(tax: Tax): number | undefined {
  return taxDefinitions[tax].defaultRate;
}

export function getTaxCodes(tax: Tax): Record<string, TaxCodeInfo> {
  return taxDefinitions[tax].codes ?? {};
}

export function getTaxRateByCode(tax: Tax, code: string | number): number | false {
  return getTaxCodes(tax)[String(code)]?.rate ?? false;
}

export function taxFromCode(code: string): Tax | undefined {
  return taxCases().find((item) => getTaxCode(item) === code);
}
