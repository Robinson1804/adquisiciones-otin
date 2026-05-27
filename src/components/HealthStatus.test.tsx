import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ETAPAS_CONFIG, COLORES_ACTOR } from "@/lib/constants";

// ----------------------------------------------------------------
// Test 1 — ETAPAS_CONFIG completeness (pure unit, no render)
// ----------------------------------------------------------------
describe("ETAPAS_CONFIG", () => {
  it("has exactly 28 stages", () => {
    expect(ETAPAS_CONFIG.length).toBe(28);
  });

  it("contains all expected cod values", () => {
    const cods = ETAPAS_CONFIG.map((e) => e.cod);
    const expected = [
      "E01", "E02", "E03", "E04", "E05", "E06", "E06b", "E07", "E08",
      "E08a", "E08b", "E09", "E10", "E11", "E12", "E13", "E14",
      "E15", "E16", "E17", "E18", "E19", "E20", "E21", "E22",
      "E23", "E24", "E25",
    ];
    expect(cods).toEqual(expected);
  });

  it("has unique cod values", () => {
    const cods = ETAPAS_CONFIG.map((e) => e.cod);
    const unique = new Set(cods);
    expect(unique.size).toBe(28);
  });
});

// ----------------------------------------------------------------
// Test 2 — COLORES_ACTOR shape
// ----------------------------------------------------------------
describe("COLORES_ACTOR", () => {
  it("has exactly 8 actor keys", () => {
    expect(Object.keys(COLORES_ACTOR).length).toBe(8);
  });

  it("BUCLE has dashed: true", () => {
    expect(COLORES_ACTOR.BUCLE.dashed).toBe(true);
  });
});

// ----------------------------------------------------------------
// Test 3 — HealthStatus component (render + mock api)
// ----------------------------------------------------------------
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@/lib/api";
import HealthStatus from "./HealthStatus";

describe("HealthStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'connected' when backend returns ok", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { status: "ok", database: "connected" },
    });

    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByText("connected")).toBeInTheDocument();
    });
  });

  it("shows error state when api call rejects", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network Error"));

    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
