import { type Tax, getTaxCode, taxHasVat } from "../enums";
import { arrayColumnSum, amountFormat } from "../utils";
import type { ModelMeta, TaxLine, TaxLineInternal } from "./types";

export abstract class BaseItem {
  protected readonly imported: boolean;
  protected taxes: Record<string, TaxLineInternal> = {};

  protected constructor(meta: ModelMeta = {}) {
    this.imported = meta.imported ?? false;
  }

  public static new<TFields, TInstance>(
    this: new (fields: TFields, meta?: ModelMeta) => TInstance,
    fields: TFields,
  ): TInstance {
    return new this(fields);
  }

  protected setTax(
    tax: Tax,
    rate: number,
    amount: number | (() => number),
    vat = 0,
  ): void {
    this.taxes[tax] = {
      model: tax,
      rate,
      amount,
      vat,
    };
  }

  public addTaxFromArray(
    taxes: Array<[Tax, number, number?, number?]> = [],
  ): this {
    for (const [tax, rate, amount = 0, vat = 0] of taxes) {
      (
        this as unknown as {
          addTax: (
            tax: Tax,
            rate: number,
            amount?: number,
            vat?: number,
          ) => BaseItem;
        }
      ).addTax(tax, rate, amount, vat);
    }
    return this;
  }

  public getTaxes(): TaxLine[] {
    return Object.values(this.taxes).map((tax) => ({
      model: tax.model,
      rate: tax.rate,
      amount:
        typeof tax.amount === "function"
          ? amountFormat(tax.amount())
          : amountFormat(tax.amount),
      vat: amountFormat(tax.vat),
    }));
  }

  protected taxExists(...taxes: Tax[]): boolean {
    return Object.values(this.taxes).some((tax) => taxes.includes(tax.model));
  }

  protected calculateTaxes(): void {
    this.taxes = Object.fromEntries(
      Object.entries(this.taxes).map(([key, tax]) => [
        key,
        {
          ...tax,
          amount:
            typeof tax.amount === "function"
              ? amountFormat(tax.amount())
              : amountFormat(tax.amount),
          vat: amountFormat(tax.vat),
        },
      ]),
    );
  }

  protected exportTaxes(lowerFirst = false): Record<string, number> {
    const exported: Record<string, number> = {};
    for (const tax of this.getTaxes()) {
      const code = getTaxCode(tax.model);
      const keys: Array<[keyof TaxLine, string]> = [
        ["rate", `V${code}Orani`],
        ["amount", `V${code}Tutari`],
      ];

      if (taxHasVat(tax.model)) {
        keys.push(["vat", `V${code}KdvTutari`]);
      }

      for (const [field, key] of keys) {
        const exportKey = lowerFirst
          ? `${key.slice(0, 1).toLowerCase()}${key.slice(1)}`
          : key;
        exported[exportKey] = tax[field] as number;
      }
    }
    return exported;
  }

  public totalTaxAmount(filterFn?: (tax: TaxLine) => boolean): number {
    const values = Object.values(this.taxes)
      .filter((tax) =>
        filterFn
          ? filterFn({
              model: tax.model,
              rate: tax.rate,
              amount: 0,
              vat: amountFormat(tax.vat),
            })
          : true,
      )
      .map((tax) => ({
        model: tax.model,
        rate: tax.rate,
        amount:
          typeof tax.amount === "function"
            ? amountFormat(tax.amount())
            : amountFormat(tax.amount),
        vat: amountFormat(tax.vat),
      }));

    return arrayColumnSum(values, "amount");
  }

  public totalTaxVat(filterFn?: (tax: TaxLine) => boolean): number {
    const values = Object.values(this.taxes)
      .filter((tax) =>
        filterFn
          ? filterFn({
              model: tax.model,
              rate: tax.rate,
              amount: 0,
              vat: amountFormat(tax.vat),
            })
          : true,
      )
      .map((tax) => ({
        model: tax.model,
        rate: tax.rate,
        amount:
          typeof tax.amount === "function"
            ? amountFormat(tax.amount())
            : amountFormat(tax.amount),
        vat: amountFormat(tax.vat),
      }));

    return arrayColumnSum(values, "vat");
  }

  public eachWith<T>(
    data: Iterable<T>,
    fn: (self: this, item: T, index: number) => void,
  ): this {
    let index = 0;
    for (const item of data) {
      fn(this, item, index);
      index += 1;
    }
    return this;
  }

  public each(fn: (value: unknown, key: string, self: this) => void): this {
    for (const [key, value] of Object.entries(this.toArray())) {
      fn(value, key, this);
    }
    return this;
  }

  public map(fn: (value: unknown, key: string, self: this) => unknown): this {
    for (const [key, value] of Object.entries(this.toArray())) {
      (this as Record<string, unknown>)[key] = fn(value, key, this);
    }
    return this;
  }

  public toArray(): Record<string, unknown> {
    const {
      imported: _imported,
      taxes: _taxes,
      ...rest
    } = this as unknown as Record<string, unknown>;
    return rest;
  }

  public abstract export(): Record<string, unknown>;
  public abstract prepare(parent: unknown): this;
}
