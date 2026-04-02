import { ValidationError, FormatError } from "../errors";
import { applyKeyMap, curdate, FormatValidator, numberToWords } from "../utils";
import type { ItemModel, ModelMeta, ImportSource, TaxLine } from "./types";

export abstract class BaseDocument<TItem extends ItemModel = ItemModel> {
  protected readonly importSource: ImportSource;
  protected readonly imported: boolean;
  protected importedDirty = false;

  public uuid = "";
  public tarih = "";
  public saat = "";
  public malHizmetListe: Array<TItem | Record<string, unknown>> = [];

  protected constructor(meta: ModelMeta = {}) {
    this.imported = meta.imported ?? false;
    this.importSource = meta.importSource ?? "fresh";
  }

  public static new<TFields, TInstance>(
    this: new (fields: TFields, meta?: ModelMeta) => TInstance,
    fields: TFields,
  ): TInstance {
    return new this(fields);
  }

  protected initializeBase(): void {
    if (this.uuid) {
      if (!FormatValidator.uuid(this.uuid)) {
        throw new ValidationError("Uuid geçerli formatta değil.", this.uuid);
      }
    } else {
      this.uuid = crypto.randomUUID();
    }

    if (this.tarih) {
      if (!FormatValidator.date(this.tarih)) {
        throw new FormatError("Tarih geçerli formatta değil.", this.tarih);
      }
    } else {
      this.tarih = curdate("d/m/Y");
    }

    if (this.saat) {
      if (!FormatValidator.time(this.saat)) {
        throw new FormatError("Saat geçerli formatta değil.", this.saat);
      }
    } else {
      this.saat = curdate("H:i:s");
    }

    this.bootstrapExistingItems();
  }

  protected bootstrapExistingItems(): void {
    const items = this.getItems(false);
    if (!items.length || this.importSource === "api") {
      return;
    }

    this.clearItems();
    const hydrated = items.map((item) =>
      this.importSource === "model"
        ? this.itemFactory(item as Record<string, unknown>, "model")
        : this.itemFactory(item as Record<string, unknown>, "fresh"),
    );

    this.setItemsInternal(hydrated as TItem[], true);
  }

  protected abstract itemFactory(data: Record<string, unknown>, source: ImportSource): TItem;
  protected abstract calculateTotals(): void;
  protected abstract keyMap(): Record<string, string>;

  protected keyMapper(data: Record<string, unknown>, reverse = false): Record<string, unknown> {
    return applyKeyMap(data, this.keyMap(), reverse);
  }

  protected setItemsInternal(items: TItem[], duringBootstrap = false): void {
    for (const item of items) {
      this.malHizmetListe.push(item.prepare(this));
    }

    if (this.importSource === "api" && !this.importedDirty) {
      this.malHizmetListe = this.malHizmetListe.filter((item): item is TItem =>
        typeof item === "object" && item !== null && "prepare" in item,
      );
      this.importedDirty = true;
    }

    if (!duringBootstrap || this.importSource !== "model") {
      this.calculateTotals();
    }
  }

  protected clearItems(): this {
    this.malHizmetListe = [];
    return this;
  }

  public getUuid(): string {
    return this.uuid;
  }

  public getItems(toExport = false): Array<TItem | Record<string, unknown>> {
    if (!toExport) {
      return this.malHizmetListe;
    }

    return this.malHizmetListe.map((item) =>
      typeof item === "object" && item !== null && "export" in item
        ? (item as TItem).export()
        : item,
    );
  }

  public getTaxes(): TaxLine[] {
    const taxes: TaxLine[] = [];
    for (const item of this.malHizmetListe) {
      if (typeof item === "object" && item !== null && "getTaxes" in item) {
        taxes.push(...(item as TItem).getTaxes());
      }
    }
    return taxes;
  }

  public mapItems(fn: (self: this, item: TItem | Record<string, unknown>, index: number) => TItem | Record<string, unknown>): this {
    this.malHizmetListe = this.malHizmetListe.map((item, index) => fn(this, item, index));
    this.calculateTotals();
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
    const { importSource: _importSource, imported: _imported, importedDirty: _importedDirty, ...rest } =
      this as unknown as Record<string, unknown>;
    return rest;
  }

  public setAutoNote(): this {
    return this.setNote(numberToWords(this.getPaymentTotal()));
  }

  public abstract getPaymentTotal(): number;
  public abstract setNote(note: string): this;
  public abstract export(): Record<string, unknown>;
}
