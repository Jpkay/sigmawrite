/**
 * Small in-memory stand-in for the Supabase query builder, enough for the
 * story-mode server code and the editorial story service in tests:
 * select / insert / update / upsert / delete with eq, neq, is, in, gte, not,
 * order, limit, single, maybeSingle and head counts. Embedded relations and
 * column lists are ignored (whole rows are returned).
 */
type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

let counter = 0;
export const fakeId = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;

export function createFakeSupabase(seed: Record<string, Row[]> = {}, options: { uniqueKeys?: Record<string, string[]>; defaults?: Record<string, Row> } = {}) {
  const tables: Record<string, Row[]> = Object.fromEntries(Object.entries(seed).map(([name, rows]) => [name, rows.map((row) => ({ ...row }))]));
  const table = (name: string) => (tables[name] ??= []);

  class Query implements PromiseLike<{ data: unknown; error: { message: string } | null; count?: number | null }> {
    private filters: Filter[] = [];
    private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
    private payload: Row[] = [];
    private patch: Row = {};
    private orderBy: { column: string; ascending: boolean } | null = null;
    private max: number | null = null;
    private singleMode: "single" | "maybe" | null = null;
    private head = false;
    private withCount = false;
    private returning = false;
    private conflict: string[] = [];
    private ignoreDuplicates = false;
    constructor(private readonly name: string) {}

    select(_columns?: string, opts?: { count?: string; head?: boolean }) {
      if (this.mode !== "select") this.returning = true;
      if (opts?.head) this.head = true;
      if (opts?.count) this.withCount = true;
      return this;
    }
    insert(rows: Row | Row[]) { this.mode = "insert"; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
    upsert(rows: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
      this.mode = "upsert"; this.payload = Array.isArray(rows) ? rows : [rows];
      this.conflict = (opts?.onConflict ?? "id").split(",").map((part) => part.trim());
      this.ignoreDuplicates = Boolean(opts?.ignoreDuplicates);
      return this;
    }
    update(patch: Row) { this.mode = "update"; this.patch = patch; return this; }
    delete() { this.mode = "delete"; return this; }
    eq(column: string, value: unknown) { this.filters.push((row) => row[column] === value); return this; }
    neq(column: string, value: unknown) { this.filters.push((row) => row[column] !== value); return this; }
    is(column: string, value: unknown) { this.filters.push((row) => (row[column] ?? null) === value); return this; }
    in(column: string, values: unknown[]) { this.filters.push((row) => values.includes(row[column])); return this; }
    gte(column: string, value: unknown) { this.filters.push((row) => String(row[column] ?? "") >= String(value)); return this; }
    not(column: string, operator: string, value: unknown) {
      this.filters.push((row) => (operator === "is" ? (row[column] ?? null) !== value : row[column] !== value));
      return this;
    }
    order(column: string, opts?: { ascending?: boolean }) { this.orderBy = { column, ascending: opts?.ascending !== false }; return this; }
    limit(count: number) { this.max = count; return this; }
    maybeSingle() { this.singleMode = "maybe"; return this; }
    single() { this.singleMode = "single"; return this; }

    private matches() { return table(this.name).filter((row) => this.filters.every((filter) => filter(row))); }

    private run(): { data: unknown; error: { message: string } | null; count?: number | null } {
      let rows: Row[];
      if (this.mode === "insert" || this.mode === "upsert") {
        rows = [];
        for (const raw of this.payload) {
          const unique = options.uniqueKeys?.[this.name] ?? (this.mode === "upsert" ? this.conflict : []);
          const existing = unique.length ? table(this.name).find((row) => unique.every((key) => row[key] === raw[key])) : undefined;
          if (existing) {
            if (this.mode === "insert") return { data: null, error: { message: "duplicate key value violates unique constraint" } };
            if (!this.ignoreDuplicates) Object.assign(existing, raw);
            rows.push(existing);
            continue;
          }
          const row = { id: fakeId(), created_at: new Date().toISOString(), ...(options.defaults?.[this.name] ?? {}), ...raw };
          table(this.name).push(row);
          rows.push(row);
        }
      } else if (this.mode === "update") {
        rows = this.matches();
        for (const row of rows) Object.assign(row, this.patch);
      } else if (this.mode === "delete") {
        rows = this.matches();
        tables[this.name] = table(this.name).filter((row) => !rows.includes(row));
      } else {
        rows = this.matches();
      }
      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        rows = [...rows].sort((a, b) => (String(a[column] ?? "") < String(b[column] ?? "") ? -1 : String(a[column] ?? "") > String(b[column] ?? "") ? 1 : 0) * (ascending ? 1 : -1));
      }
      if (this.max != null) rows = rows.slice(0, this.max);
      const count = rows.length;
      if (this.head) return { data: null, error: null, count };
      if (this.mode !== "select" && !this.returning && !this.singleMode) return { data: null, error: null };
      if (this.singleMode) {
        if (rows.length === 0) return this.singleMode === "single" ? { data: null, error: { message: "no rows" } } : { data: null, error: null };
        return { data: { ...rows[0] }, error: null };
      }
      return { data: rows.map((row) => ({ ...row })), error: null, ...(this.withCount ? { count } : {}) };
    }

    then<T1, T2>(resolve?: ((value: { data: unknown; error: { message: string } | null; count?: number | null }) => T1 | PromiseLike<T1>) | null, reject?: ((reason: unknown) => T2 | PromiseLike<T2>) | null) {
      try { return Promise.resolve(this.run()).then(resolve, reject); } catch (error) { return Promise.reject(error).then(resolve, reject); }
    }
  }

  const client = {
    tables,
    from: (name: string) => new Query(name),
    rpc: async () => ({ data: null, error: null }),
  };
  return client;
}
