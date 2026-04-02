import type { Tax } from "../enums";

export type ImportSource = "fresh" | "model" | "api";

export type TaxLine = {
  model: Tax;
  rate: number;
  amount: number;
  vat: number;
};

export type TaxLineInternal = {
  model: Tax;
  rate: number;
  amount: number | (() => number);
  vat: number;
};

export interface Exportable<T = Record<string, unknown>> {
  export(): T;
}

export interface ItemModel extends Exportable {
  prepare(parent: unknown): this;
  getTaxes(): TaxLine[];
}

export type ModelMeta = {
  imported?: boolean;
  importSource?: ImportSource;
};
