import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageToolChecker } from "./languagetool";

afterEach(() => vi.unstubAllEnvs());

describe("LanguageTool service requests", () => {
  it("authenticates server-side and sends the original answer in the POST body", async () => {
    vi.stubEnv("LANGUAGETOOL_URL", "https://grammar.example/");
    vi.stubEnv("LANGUAGETOOL_API_KEY", "test-service-key");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ matches: [] }));
    const answer = "Les enfants jouent dans la cour.";
    const result = await new LanguageToolChecker({ fetchImpl }).check(answer);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://grammar.example/v2/check");
    expect(options?.method).toBe("POST");
    expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer test-service-key");
    expect(new URLSearchParams(String(options?.body)).get("text")).toBe(answer);
    expect(result).toMatchObject({ text: answer, clean: true });
  });

  it("supports the local service without authentication", async () => {
    vi.stubEnv("LANGUAGETOOL_API_KEY", "");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ matches: [] }));
    await new LanguageToolChecker({ baseUrl: "http://127.0.0.1:8010", fetchImpl }).check("Bonjour.");
    expect(new Headers(fetchImpl.mock.calls[0][1]?.headers).has("Authorization")).toBe(false);
  });

  it("does not mistake an authentication failure for a clean answer", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 }));
    await expect(new LanguageToolChecker({ apiKey: "wrong-key", fetchImpl }).check("Les enfants joue.")).rejects.toThrow("LanguageTool 401");
  });
});
