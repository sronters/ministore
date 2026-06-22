import { describe, expect, it } from "vitest";
import { fuzzyIncludes } from "@/lib/utils/search";

describe("fuzzyIncludes", () => {
  it("finds products by russian text case-insensitively", () => {
    expect(fuzzyIncludes("Молоко FoodMaster 2.5%, 1 л", "молоко 2.5")).toBe(true);
  });

  it("tolerates a small typo", () => {
    expect(fuzzyIncludes("Молоко FoodMaster 2.5%, 1 л", "молоко foodmastr")).toBe(true);
  });
});
