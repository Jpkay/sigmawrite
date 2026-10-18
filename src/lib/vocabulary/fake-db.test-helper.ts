/**
 * In-memory stand-in for the Supabase service client, covering the tables
 * and RPCs the word memory pipeline uses. The RPCs mirror the SQL in
 * 20261018100000_word_memory_foundation.sql closely enough to test the TS
 * flow end to end; the SQL itself is verified by pgTAP in CI.
 */
type Row = Record<string, unknown>;

export type FakeSense = { id: string; lemmaId: string; itemId: string; word: string; definition: string; forms: string[] };

export function createFakeDb(senses: FakeSense[]) {
  const tables: Record<string, Row[]> = {
    vocabulary_learning_evidence: [],
    student_word_mastery: [],
    learning_retrieval_schedules: [],
    word_review_log: [],
    text_vocabulary: [],
    student_memory_settings: [],
    fsrs_parameter_sets: [],
    students: [],
    vocabulary_items: senses.map((sense) => ({ id: sense.itemId, display_word: sense.word, definition_fr: sense.definition })),
    lexical_senses: senses.map((sense) => ({ id: sense.id, lemma_id: sense.lemmaId, definition_fr: sense.definition, lexical_lemmas: { vocabulary_item_id: sense.itemId, lemma: sense.word } })),
    lexical_forms: senses.flatMap((sense) => sense.forms.map((form) => ({ normalized_form: form, lemma_id: sense.lemmaId }))),
  };
  const rpcCalls: Array<{ name: string; args: Row }> = [];
  let ids = 0;
  const nextId = () => `00000000-0000-4000-8000-${String(++ids).padStart(12, "0")}`;

  function applyEvidence(studentId: string, row: Row) {
    const key = row.occurrence_key as string | undefined;
    if (key && tables.vocabulary_learning_evidence.some((existing) => existing.student_id === studentId && existing.occurrence_key === key)) return null;
    const id = nextId();
    tables.vocabulary_learning_evidence.push({ id, student_id: studentId, evidence_payload: row.payload ?? {}, ...row });
    let mastery = tables.student_word_mastery.find((existing) => existing.student_id === studentId && existing.vocabulary_item_id === row.vocabulary_item_id);
    if (!mastery) {
      mastery = { student_id: studentId, vocabulary_item_id: row.vocabulary_item_id, mastery: 0, exposures: 0, word_status: "decouvert", to_introduce: false, evidence_counts: {} };
      tables.student_word_mastery.push(mastery);
    }
    if (row.evidence_kind === "exposure") mastery.exposures = Number(mastery.exposures) + 1;
    mastery.to_introduce = !!mastery.to_introduce || !!row.to_introduce;
    mastery.first_seen_sentence ??= row.first_seen_sentence ?? null;
    return id;
  }

  const rpcs: Record<string, (args: Row) => unknown> = {
    ensure_vocabulary_lexical_anchors: () => 0,
    resolve_word_senses: (args) => {
      const items = (args.p_item_ids as string[]) ?? [];
      const forms = (args.p_forms as string[]) ?? [];
      const out: Row[] = [];
      for (const sense of senses) {
        const count = senses.filter((other) => other.lemmaId === sense.lemmaId).length;
        const base = { vocabulary_item_id: sense.itemId, lemma_id: sense.lemmaId, sense_id: sense.id, sense_count: count, display_word: sense.word, definition_fr: sense.definition };
        if (items.includes(sense.itemId)) out.push({ match_key: sense.itemId, ...base });
        for (const form of sense.forms) if (forms.includes(form)) out.push({ match_key: form, ...base });
      }
      return out;
    },
    record_word_evidence: (args) => {
      let count = 0;
      for (const row of args.p_rows as Row[]) if (applyEvidence(args.p_student_id as string, row)) count++;
      return count;
    },
    introduce_word_cards: (args) => {
      const sense = senses.find((candidate) => candidate.id === args.p_sense_id)!;
      for (const facet of ["spelling", "meaning"]) {
        if (tables.learning_retrieval_schedules.some((card) => card.student_id === args.p_student_id && card.target_id === sense.id && card.facet === facet)) continue;
        tables.learning_retrieval_schedules.push({
          id: nextId(), student_id: args.p_student_id, target_type: "lexical_sense", target_id: sense.id, facet, status: "scheduled",
          due_at: args.p_due_at, introduced_at: args.p_introduced_at, last_reviewed_at: null, fsrs_state: {}, repetitions: 0, lapse_count: 0, importance: 1,
        });
      }
      const mastery = tables.student_word_mastery.find((row) => row.student_id === args.p_student_id && row.vocabulary_item_id === sense.itemId);
      if (mastery) mastery.to_introduce = false;
      else tables.student_word_mastery.push({ student_id: args.p_student_id, vocabulary_item_id: sense.itemId, mastery: 0, exposures: 0, word_status: "en_route", to_introduce: false });
      return tables.learning_retrieval_schedules.filter((card) => card.student_id === args.p_student_id && card.target_id === sense.id);
    },
    record_word_review: (args) => {
      const payload = args.p_payload as Row;
      const existing = tables.word_review_log.find((row) => row.student_id === payload.student_id && row.occurrence_key === payload.occurrence_key);
      if (existing) return { log_id: existing.id, duplicate: true };
      const card = tables.learning_retrieval_schedules.find((row) => row.id === payload.schedule_id)!;
      if (payload.counts_for_fsrs) {
        if ((card.last_reviewed_at ?? null) !== (payload.expected_last_reviewed_at ?? null)) return { __error: { code: "40001", message: "stale word card" } };
        const fsrs = payload.fsrs as Row;
        Object.assign(card, { fsrs_state: fsrs, due_at: fsrs.due_at, repetitions: fsrs.reps, lapse_count: fsrs.lapses, last_reviewed_at: payload.reviewed_at });
      }
      const id = nextId();
      tables.word_review_log.push({ id, ...payload, lexical_sense_id: card.target_id, facet: card.facet });
      applyEvidence(payload.student_id as string, { ...(payload.evidence as Row), review_log_id: id, schedule_id: card.id, lexical_sense_id: card.target_id, facet: card.facet, occurrence_key: payload.occurrence_key, occurred_at: payload.reviewed_at, counts_for_fsrs: payload.counts_for_fsrs, rating: payload.rating });
      return { log_id: id, duplicate: false };
    },
  };

  class Query implements PromiseLike<{ data: unknown; error: unknown; count?: number }> {
    private filters: Array<(row: Row) => boolean> = [];
    private patch: Row | null = null;
    private singleMode: "one" | "maybe" | null = null;
    private limitTo: number | null = null;
    private ordering: { column: string; ascending: boolean } | null = null;
    constructor(private table: string) {}
    select() { return this; }
    update(patch: Row) { this.patch = patch; return this; }
    eq(column: string, value: unknown) { this.filters.push((row) => row[column] === value); return this; }
    neq(column: string, value: unknown) { this.filters.push((row) => row[column] !== value); return this; }
    in(column: string, values: unknown[]) { this.filters.push((row) => values.includes(row[column])); return this; }
    gte(column: string, value: string) { this.filters.push((row) => String(row[column] ?? "") >= value); return this; }
    not() { return this; }
    or() { return this; }
    order(column: string, options?: { ascending?: boolean }) { this.ordering = { column, ascending: options?.ascending ?? true }; return this; }
    limit(count: number) { this.limitTo = count; return this; }
    maybeSingle() { this.singleMode = "maybe"; return this; }
    singleRow() { this.singleMode = "one"; return this; }
    then<A, B>(resolve?: ((value: { data: unknown; error: unknown }) => A | PromiseLike<A>) | null, reject?: ((reason: unknown) => B | PromiseLike<B>) | null) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }
    private run() {
      let rows = (tables[this.table] ?? []).filter((row) => this.filters.every((filter) => filter(row)));
      if (this.patch) { for (const row of rows) Object.assign(row, this.patch); return { data: null, error: null }; }
      if (this.ordering) {
        const { column, ascending } = this.ordering;
        rows = [...rows].sort((a, b) => (String(a[column] ?? "") < String(b[column] ?? "") ? -1 : 1) * (ascending ? 1 : -1));
      }
      if (this.limitTo != null) rows = rows.slice(0, this.limitTo);
      if (this.singleMode) return { data: rows[0] ?? null, error: rows[0] || this.singleMode === "maybe" ? null : { message: "not found" } };
      return { data: rows, error: null };
    }
  }

  const db = {
    from(table: string) {
      const query = new Query(table);
      return new Proxy(query, { get: (target, prop) => (prop === "single" ? () => target.singleRow() : (target as unknown as Record<string | symbol, unknown>)[prop]) });
    },
    async rpc(name: string, args: Row) {
      rpcCalls.push({ name, args });
      const result = rpcs[name]?.(args);
      if (result && typeof result === "object" && "__error" in (result as Row)) return { data: null, error: (result as Row).__error };
      return { data: result ?? null, error: null };
    },
  };
  return { db, tables, rpcCalls };
}
