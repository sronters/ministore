import { describe, expect, it } from "vitest";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";

describe("format helpers", () => {
  it("formats tenge without currency code decimals", () => {
    expect(formatMoney(5430)).toBe("5 430 ₸");
  });

  it("formats recent ISO dates as relative minutes", () => {
    expect(formatRelativeDate("2026-06-22T14:18:00+05:00", new Date("2026-06-22T14:30:00+05:00"))).toBe(
      "обновлено 12 минут назад"
    );
  });
});
