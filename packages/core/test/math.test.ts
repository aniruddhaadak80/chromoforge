import { describe, expect, it } from "vitest";
import { clamp, mismatch, missionClock, saturatingSum } from "../src/util/math.js";

describe("clamp", () => {
  it("keeps a value inside the default [0, 1] range", () => {
    expect(clamp(0.5)).toBe(0.5);
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
  });

  it("passes the bounds through unchanged", () => {
    expect(clamp(0)).toBe(0);
    expect(clamp(1)).toBe(1);
  });

  it("honors a custom [min, max] range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("still clamps when the range starts above zero", () => {
    expect(clamp(-20, 1, 10)).toBe(1);
    expect(clamp(9, 1, 10)).toBe(9);
  });
});

describe("missionClock", () => {
  it("formats sub-minute and sub-hour spans", () => {
    expect(missionClock(0)).toBe("00:00:00");
    expect(missionClock(59)).toBe("00:00:59");
    expect(missionClock(60)).toBe("00:01:00");
    expect(missionClock(3599)).toBe("00:59:59");
  });

  it("formats hour spans", () => {
    expect(missionClock(3600)).toBe("01:00:00");
    expect(missionClock(3661)).toBe("01:01:01");
    expect(missionClock(86399)).toBe("23:59:59");
  });

  it("keeps counting hours past a day rather than wrapping", () => {
    expect(missionClock(86400)).toBe("24:00:00");
    expect(missionClock(90001)).toBe("25:00:01");
  });

  it("discards fractional seconds and clamps negatives at zero", () => {
    expect(missionClock(59.9)).toBe("00:00:59");
    expect(missionClock(60.9)).toBe("00:01:00");
    expect(missionClock(-1)).toBe("00:00:00");
    expect(missionClock(-3600)).toBe("00:00:00");
  });
});

describe("mismatch", () => {
  it("is 0 at ideal and 1 far beyond tolerance", () => {
    expect(mismatch(0.5, 0.5, 0.5)).toBe(0);
    expect(mismatch(1.0, 0.5, 0.5)).toBe(1);
  });

  it("is linear in distance at the tolerance edge", () => {
    expect(mismatch(0.75, 0.5, 0.5)).toBeCloseTo(0.5, 5);
  });
});

describe("saturatingSum", () => {
  it("has diminishing returns", () => {
    const single = saturatingSum([0.3]);
    const double = saturatingSum([0.3, 0.3]);
    const triple = saturatingSum([0.3, 0.3, 0.3]);
    expect(single).toBeCloseTo(0.3, 5);
    expect(double).toBeGreaterThan(single);
    expect(triple).toBeGreaterThan(double);
    expect(triple).toBeLessThan(0.9); // saturation forbids going to 3 × 0.3
  });
});
