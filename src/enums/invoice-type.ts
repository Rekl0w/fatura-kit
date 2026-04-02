export const InvoiceType = {
  Satis: "SATIS",
  Iade: "IADE",
  Tevkifat: "TEVKIFAT",
  Istisna: "ISTISNA",
  OzelMatrah: "OZELMATRAH",
  IhracKayitli: "IHRACKAYITLI",
  KonaklamaVergisi: "KONAKLAMAVERGISI",
} as const;

export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType];

const invoiceTypeAliases: Record<InvoiceType, string> = {
  [InvoiceType.Satis]: "Satış",
  [InvoiceType.Iade]: "İade",
  [InvoiceType.Tevkifat]: "Tevkifat",
  [InvoiceType.Istisna]: "İstisna",
  [InvoiceType.OzelMatrah]: "Özel Matrah",
  [InvoiceType.IhracKayitli]: "İhraç Kayıtlı",
  [InvoiceType.KonaklamaVergisi]: "Konaklama Vergisi",
};

const ozelMatrahReasons = {
  801: "Milli Piyango, Spor Toto vb. Oyunlar",
  802: "At yarışları ve diğer müşterek bahis ve talih oyunları",
  803: "Profesyonel Sanatçıların Yer Aldığı Gösteriler, Konserler, Profesyonel Sporcuların Katıldığı Sportif Faaliyetler, Maçlar, Yarışlar ve Yarışmalar",
  804: "Gümrük Depolarında ve Müzayede Mahallerinde Yapılan Satışla",
  805: "Altından Mamül veya Altın İçeren Ziynet Eşyaları İle Sikke Altınların Teslimi",
  806: "Tütün Mamülleri",
  807: "Muzır Neşriyat Kapsamındaki  Gazete, Dergi vb. Periyodik Yayınlar",
  808: "Gümüşten Mamul veya Gümüş İçeren Ziynet Eşyaları ile Sikke Gümüşlerin Teslimi",
  809: "Belediyeler taraf. yap. şehiriçi yolcu taşımacılığında kullanılan biletlerin ve kartların bayiler tarafından satışı",
  810: "Ön Ödemeli Elektronik Haberleşme Hizmetleri",
  811: "TŞOF Tarafından Araç Plakaları ile Sürücü Kurslarında Kullanılan Bir Kısım Evrakın Teslimi",
  812: "KDV Uygulanmadan Alınan İkinci El Motorlu Kara Taşıtı veya Taşınmaz Teslimi",
} as const;

export function invoiceTypeCases(): InvoiceType[] {
  return Object.values(InvoiceType);
}

export function getInvoiceTypeAlias(value: InvoiceType): string {
  return invoiceTypeAliases[value];
}

export function getInvoiceTypeReasons(
  value: InvoiceType,
): Record<string, string> {
  return value === InvoiceType.OzelMatrah ? { ...ozelMatrahReasons } : {};
}
