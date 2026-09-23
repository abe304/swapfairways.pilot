import { store, uid, nowIso, type MockRow, type MockTable } from "./store";

type SelectField =
  | { kind: "all" }
  | { kind: "column"; name: string }
  | { kind: "embed"; name: string; fields: SelectField[] };

type EmbedConfig = { type: "forward" | "reverse"; fkColumn: string; target: MockTable };

// Solo las relaciones realmente usadas en los `select()` de la app (ver
// supabase/migrations/0001_init.sql para las FKs reales). No es un motor
// PostgREST genérico, cubre exactamente los patrones de este proyecto.
const EMBED_CONFIG: Partial<Record<MockTable, Record<string, EmbedConfig>>> = {
  tee_time_offers: {
    clubs: { type: "forward", fkColumn: "club_id", target: "clubs" },
    profiles: { type: "forward", fkColumn: "host_id", target: "profiles" },
    requests: { type: "reverse", fkColumn: "offer_id", target: "requests" },
  },
  profiles: {
    clubs: { type: "forward", fkColumn: "club_id", target: "clubs" },
  },
  profile_clubs: {
    clubs: { type: "forward", fkColumn: "club_id", target: "clubs" },
  },
  requests: {
    profiles: { type: "forward", fkColumn: "guest_id", target: "profiles" },
    tee_time_offers: { type: "forward", fkColumn: "offer_id", target: "tee_time_offers" },
  },
};

const TABLE_DEFAULTS: Partial<Record<MockTable, MockRow>> = {
  tee_time_offers: { pases_confirmados: 0, estado: "activa", fecha_flexible: false },
  profile_contacts: {},
};

const UPSERT_KEY: Partial<Record<MockTable, string>> = {
  profile_contacts: "user_id",
};

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function parseSelect(select: string): SelectField[] {
  return splitTopLevel(select).map((raw) => {
    const token = raw.trim();
    if (token === "*") return { kind: "all" };
    const match = token.match(/^([a-zA-Z0-9_]+)(?:![a-zA-Z0-9_]+)?\(([\s\S]+)\)$/);
    if (match) {
      return { kind: "embed", name: match[1], fields: parseSelect(match[2]) };
    }
    return { kind: "column", name: token };
  });
}

function projectRow(row: MockRow, table: MockTable, fields: SelectField[]): MockRow {
  const result: MockRow = {};
  if (fields.some((f) => f.kind === "all")) Object.assign(result, row);

  for (const field of fields) {
    if (field.kind === "column") {
      result[field.name] = row[field.name];
    } else if (field.kind === "embed") {
      const config = EMBED_CONFIG[table]?.[field.name];
      if (!config) {
        result[field.name] = null;
        continue;
      }
      if (config.type === "forward") {
        const fkVal = row[config.fkColumn];
        const target = store[config.target].find((r) => r.id === fkVal);
        result[field.name] = target ? projectRow(target, config.target, field.fields) : null;
      } else {
        const children = store[config.target].filter((r) => r[config.fkColumn] === row.id);
        result[field.name] = children.map((c) => projectRow(c, config.target, field.fields));
      }
    }
  }
  return result;
}

type Filter = { col: string; op: "eq" | "gte" | "in"; val: unknown };

type MockResult<T> = { data: T; error: null } | { data: null; error: { message: string; code?: string } };

export class MockQueryBuilder implements PromiseLike<MockResult<unknown>> {
  private table: MockTable;
  private selectCols: string | null = null;
  private filters: Filter[] = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: MockRow | MockRow[] | null = null;
  private wantSingle = false;
  private wantMaybeSingle = false;

  constructor(table: MockTable) {
    this.table = table;
  }

  select(cols: string) {
    this.selectCols = cols;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: "eq", val });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ col, op: "gte", val });
    return this;
  }

  in(col: string, val: unknown[]) {
    this.filters.push({ col, op: "in", val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.wantMaybeSingle = true;
    return this;
  }

  insert(payload: MockRow | MockRow[]) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: MockRow) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: MockRow) {
    this.mode = "upsert";
    this.payload = payload;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  then<TResult1 = MockResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: MockResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private matches(row: MockRow) {
    return this.filters.every((f) => {
      if (f.op === "eq") return row[f.col] === f.val;
      if (f.op === "gte") return (row[f.col] as string) >= (f.val as string);
      if (f.op === "in") return (f.val as unknown[]).includes(row[f.col]);
      return true;
    });
  }

  private project(rows: MockRow[]) {
    const fields = this.selectCols ? parseSelect(this.selectCols) : [{ kind: "all" as const }];
    return rows.map((r) => projectRow(r, this.table, fields));
  }

  private finish(rows: MockRow[]): MockResult<unknown> {
    const projected = this.project(rows);
    if (this.wantSingle) {
      if (projected.length !== 1) {
        return { data: null, error: { message: "No se encontró el registro.", code: "PGRST116" } };
      }
      return { data: projected[0], error: null };
    }
    if (this.wantMaybeSingle) {
      return { data: (projected[0] as MockRow) ?? null, error: null };
    }
    return { data: projected, error: null };
  }

  private async execute(): Promise<MockResult<unknown>> {
    const table = store[this.table];

    if (this.mode === "select") {
      let rows = table.filter((r) => this.matches(r));
      if (this.orderCol) {
        const col = this.orderCol;
        rows = [...rows].sort((a, b) => {
          const av = a[col] as string | number;
          const bv = b[col] as string | number;
          if (av < bv) return this.orderAsc ? -1 : 1;
          if (av > bv) return this.orderAsc ? 1 : -1;
          return 0;
        });
      }
      return this.finish(rows);
    }

    if (this.mode === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload as MockRow];
      const defaults = TABLE_DEFAULTS[this.table] ?? {};
      const inserted = items.map((item) => {
        const row: MockRow = {
          id: uid(this.table),
          created_at: nowIso(),
          ...defaults,
          ...item,
        };
        table.push(row);
        return row;
      });
      return this.finish(inserted);
    }

    if (this.mode === "update") {
      const targets = table.filter((r) => this.matches(r));
      targets.forEach((r) => Object.assign(r, this.payload));
      return this.finish(targets);
    }

    if (this.mode === "upsert") {
      const key = UPSERT_KEY[this.table] ?? "id";
      const payload = this.payload as MockRow;
      const existing = table.find((r) => r[key] === payload[key]);
      if (existing) {
        Object.assign(existing, payload, { updated_at: nowIso() });
        return this.finish([existing]);
      }
      const row: MockRow = { updated_at: nowIso(), ...payload };
      table.push(row);
      return this.finish([row]);
    }

    if (this.mode === "delete") {
      const removed = table.filter((r) => this.matches(r));
      for (let i = table.length - 1; i >= 0; i--) {
        if (this.matches(table[i])) table.splice(i, 1);
      }
      return this.finish(removed);
    }

    return { data: null, error: { message: `Modo no soportado: ${this.mode}` } };
  }
}

export function mockFrom(table: MockTable) {
  return new MockQueryBuilder(table);
}
