/**
 * LanguageTool grammar-checker client (Roadmap Phase 8).
 *
 * Talks to a LanguageTool HTTP server's /v2/check endpoint. Point LANGUAGETOOL_URL
 * at a self-hosted instance in production (see docker-compose.languagetool.yml);
 * it falls back to the public API for local development and smoke tests. The
 * public API is rate-limited and not for production or sensitive text.
 *
 * Response shape: https://languagetool.org/http-api/
 */

import type {
  FrenchGrammarChecker,
  GrammarCheckOptions,
  GrammarCheckResult,
  GrammarMatch,
} from "./types";

const LOCAL_SERVICE = "http://127.0.0.1:8010";

type LtReplacement = { value: string };
type LtMatch = {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements?: LtReplacement[];
  rule?: {
    id: string;
    description?: string;
    issueType?: string;
    category?: { id?: string; name?: string };
  };
};
type LtResponse = { matches?: LtMatch[]; language?: { code?: string } };

export type LanguageToolConfig = {
  baseUrl?: string;
  /** Override the global fetch (for tests). */
  fetchImpl?: typeof fetch;
  /** Request timeout, ms. */
  timeoutMs?: number;
};

export class LanguageToolChecker implements FrenchGrammarChecker {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: LanguageToolConfig = {}) {
    this.baseUrl = (
      config.baseUrl ??
      process.env.LANGUAGETOOL_URL ??
      LOCAL_SERVICE
    ).replace(/\/$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  async check(
    text: string,
    opts: GrammarCheckOptions = {}
  ): Promise<GrammarCheckResult> {
    const language = opts.language ?? "fr";
    const body = new URLSearchParams({ text, language });
    if (opts.level) body.set("level", opts.level);
    if (opts.enabledRules?.length)
      body.set("enabledRules", opts.enabledRules.join(","));
    if (opts.disabledRules?.length)
      body.set("disabledRules", opts.disabledRules.join(","));
    if (opts.enabledCategories?.length)
      body.set("enabledCategories", opts.enabledCategories.join(","));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}/v2/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: body.toString(),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      throw new Error(
        `LanguageTool ${res.status} ${res.statusText} at ${this.baseUrl}`
      );
    }
    const json = (await res.json()) as LtResponse;
    return mapResponse(text, language, json);
  }
}

export function mapResponse(
  text: string,
  language: string,
  json: LtResponse
): GrammarCheckResult {
  const matches: GrammarMatch[] = (json.matches ?? []).map((m) => ({
    message: m.message,
    shortMessage: m.shortMessage,
    offset: m.offset,
    length: m.length,
    ruleId: m.rule?.id ?? "UNKNOWN",
    ruleDescription: m.rule?.description,
    category: m.rule?.category?.id ?? "UNKNOWN",
    issueType: m.rule?.issueType,
    replacements: (m.replacements ?? []).map((r) => r.value),
  }));
  return {
    text,
    language: json.language?.code ?? language,
    matches,
    clean: matches.length === 0,
  };
}
