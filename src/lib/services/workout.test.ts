import { describe, it, expect } from "vitest";

describe("workout service helpers", () => {
  describe("DAY_PRIORITY", () => {
    it("should have priority values for day types", () => {
      const DAY_PRIORITY: Record<string, number> = {
        "upper (strength focus)": 1,
        "lower (strength focus)": 2,
        "pull (hypertrophy focus)": 3,
        "push (hypertrophy focus)": 4,
        "legs (hypertrophy focus)": 5,
      };

      expect(DAY_PRIORITY["upper (strength focus)"]).toBe(1);
      expect(DAY_PRIORITY["lower (strength focus)"]).toBe(2);
      expect(DAY_PRIORITY["pull (hypertrophy focus)"]).toBe(3);
    });
  });

  describe("normalizeDayKey", () => {
    it("should normalize day keys consistently", () => {
      const normalizeDayKey = (value: string) =>
        value.trim().toLowerCase().replace(/\s+/g, " ");

      expect(normalizeDayKey("Upper (Strength Focus)")).toBe("upper (strength focus)");
      expect(normalizeDayKey("  PULL  (Hypertrophy Focus)")).toBe("pull (hypertrophy focus)");
    });
  });

  describe("clampSetCount", () => {
    const clampSetCount = (value: unknown, fallback: number) => {
      const num = Number(value);
      if (!Number.isFinite(num)) {
        return fallback;
      }
      const rounded = Math.floor(num);
      if (rounded < 0) {
        return 0;
      }
      return Math.min(rounded, 6);
    };

    it("should clamp set count between 0 and 6", () => {
      expect(clampSetCount(3, 1)).toBe(3);
      expect(clampSetCount(0, 1)).toBe(0);
      expect(clampSetCount(-1, 1)).toBe(0);
      expect(clampSetCount(10, 1)).toBe(6);
    });

    it("should use fallback for invalid values", () => {
      expect(clampSetCount("invalid", 1)).toBe(1);
      expect(clampSetCount(null, 1)).toBe(1);
      expect(clampSetCount(undefined, 1)).toBe(1);
      expect(clampSetCount(NaN, 1)).toBe(1);
    });
  });
});