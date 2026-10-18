import { describe, expect, it } from "vitest";
import { renderHero, sanitizeHeroName } from "./hero";

describe("hero insertion (H.2)", () => {
  it("inserts the name with elision and agreements", () => {
    const t = "Le sac de {{HEROS}} était lourd. {{HEROS}} était {{m:prêt|f:prête}}.";
    expect(renderHero(t, { name: "Inès", gender: "f" })).toBe("Le sac d’Inès était lourd. Inès était prête.");
    expect(renderHero(t, { name: "Paul", gender: "m" })).toBe("Le sac de Paul était lourd. Paul était prêt.");
  });
  it("sanitizes names", () => {
    expect(sanitizeHeroName("<b>Zoé</b> 123")).toBe("bZoéb");
    expect(sanitizeHeroName("x")).toBeNull();
  });
});
