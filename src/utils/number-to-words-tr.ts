const ones = [
  "",
  "bir",
  "iki",
  "üç",
  "dört",
  "beş",
  "altı",
  "yedi",
  "sekiz",
  "dokuz",
];
const tens = [
  "",
  "on",
  "yirmi",
  "otuz",
  "kırk",
  "elli",
  "altmış",
  "yetmiş",
  "seksen",
  "doksan",
];
const scales = ["", "bin", "milyon", "milyar", "trilyon", "katrilyon"];

function convertHundreds(num: number): string {
  let result = "";
  const hundred = Math.floor(num / 100);
  const ten = Math.floor((num % 100) / 10);
  const one = num % 10;

  if (hundred > 0) {
    result += `${hundred === 1 ? "" : ones[hundred]}yüz`;
  }

  if (ten > 0) {
    result += `${result ? " " : ""}${tens[ten]}`;
  }

  if (one > 0) {
    result += `${result ? " " : ""}${ones[one]}`;
  }

  return result.trim();
}

function convertInteger(num: number): string {
  if (num === 0) return "sıfır";

  const parts: string[] = [];
  let remaining = num;
  let scaleIndex = 0;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = convertHundreds(chunk);
      if (scaleIndex === 1 && chunk === 1) {
        parts.unshift("bin");
      } else {
        parts.unshift(
          [chunkWords, scales[scaleIndex]].filter(Boolean).join(" "),
        );
      }
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }

  return parts.join(" ").trim();
}

export function numberToWords(value: number): string {
  const fixed = value.toFixed(2);
  const [liraPart, kurusPart] = fixed.split(".");
  const lira = Number.parseInt(liraPart ?? "0", 10);
  const kurus = Number.parseInt(kurusPart ?? "0", 10);

  const liraWords = `${convertInteger(lira)} türk lirası`;
  const kurusWords = kurus > 0 ? ` ${convertInteger(kurus)} kuruş` : "";

  return `${liraWords}${kurusWords}`
    .replace(/i/g, "İ")
    .replace(/ı/g, "I")
    .toLocaleUpperCase("tr-TR");
}
