export type DocumentSummary = {
  belgeNumarasi: string;
  aliciVknTckn: string;
  aliciUnvanAdSoyad: string;
  belgeTarihi: string;
  belgeTuru: string;
  onayDurumu: string;
  ettn: string;
  [key: string]: unknown;
};

export type QueryState = {
  column: [] | [string, string?];
  filters: Record<string, string>;
  limit: [] | [number, number];
  sortByDesc: boolean;
};

export function createInitialQueryState(): QueryState {
  return {
    column: [],
    filters: {},
    limit: [],
    sortByDesc: false,
  };
}

export function applyDocumentQuery(
  documents: Record<string, unknown>[] | null | undefined,
  state: QueryState,
): { data: unknown; rowCount: number } {
  if (!documents) {
    return { data: [], rowCount: 0 };
  }

  let result = [...documents];

  for (const [key, expected] of Object.entries(state.filters)) {
    result = result.filter((document) => {
      const value = document[key];
      return typeof value === "string"
        ? value === expected ||
            value
              .toLocaleLowerCase("tr-TR")
              .includes(expected.toLocaleLowerCase("tr-TR"))
        : false;
    });
  }

  const rowCount = result.length;

  if (state.sortByDesc) {
    result = result.reverse();
  }

  if (state.limit.length) {
    const [offset, limit] = state.limit;
    result = result.slice(offset, offset + limit);
  }

  if (state.column.length) {
    const [column, key] = state.column;
    if (key) {
      const mapped = result.reduce<Record<string, unknown>>((acc, item) => {
        const recordKey = item[key];
        if (typeof recordKey === "string") acc[recordKey] = item[column];
        return acc;
      }, {});

      return { data: mapped, rowCount };
    }

    return {
      data: result.map((item) => item[column]),
      rowCount,
    };
  }

  return { data: result, rowCount };
}
