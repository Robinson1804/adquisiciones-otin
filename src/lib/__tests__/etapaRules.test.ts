/**
 * C3b WU-F6 — etapaRules.ts tests.
 * Pure function tests — no DOM, no React, fast.
 * Verifies each prerequisite rule (R1/R3/R5/R6/R7) blocks and unblocks correctly.
 */

import { describe, it, expect } from "vitest";
import { getEtapaActionability } from "@/lib/etapaRules";
import type { EtapaAgrupada, FilaArea } from "@/types/etapa";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function makeEtapa(cod: string, overrides: Partial<EtapaAgrupada> = {}): EtapaAgrupada {
  return {
    cod,
    nombre: `Etapa ${cod}`,
    area_responsable: 'OTIN',
    es_bucle: false,
    por_area: false,
    estado: 'PENDIENTE',
    filas: [],
    rondas: [],
    alerta_otpp: null,
    monto_total: null,
    ...overrides,
  };
}

function makeFilaArea(overrides: Partial<FilaArea> = {}): FilaArea {
  return {
    id: 1,
    area_usuaria: 'DTDIS',
    estado_etapa: 'COMPLETADO',
    fecha_inicio: null,
    fecha_fin: null,
    dias: null,
    ...overrides,
  };
}

// ----------------------------------------------------------------
// No-prereq stages
// ----------------------------------------------------------------

describe("getEtapaActionability — no prerequisites", () => {
  it("E03 has no prereq → canRegister: true", () => {
    const etapa = makeEtapa('E03');
    const result = getEtapaActionability(etapa, [etapa]);
    expect(result.canRegister).toBe(true);
    expect(result.blockedReason).toBeNull();
  });

  it("E01 has no prereq → canRegister: true", () => {
    const etapa = makeEtapa('E01');
    const result = getEtapaActionability(etapa, [etapa]);
    expect(result.canRegister).toBe(true);
    expect(result.blockedReason).toBeNull();
  });
});

// ----------------------------------------------------------------
// R1 — E02: all E01 areas must have cmn_adjunto='SI'
// ----------------------------------------------------------------

describe("getEtapaActionability — R1 (E02 / E01 CMN)", () => {
  it("blocked when E01 is PENDIENTE (not even completed)", () => {
    const e01 = makeEtapa('E01', { estado: 'PENDIENTE' });
    const e02 = makeEtapa('E02');
    const result = getEtapaActionability(e02, [e01, e02]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toMatch(/E01|CMN/i);
  });

  it("blocked when E01 is COMPLETADO but one area has cmn_adjunto!=SI", () => {
    const e01 = makeEtapa('E01', {
      estado: 'COMPLETADO',
      filas: [
        makeFilaArea({ area_usuaria: 'DTDIS', cmn_adjunto: 'SI' }),
        makeFilaArea({ area_usuaria: 'OGA', cmn_adjunto: 'PENDIENTE' }),
      ],
    });
    const e02 = makeEtapa('E02');
    const result = getEtapaActionability(e02, [e01, e02]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toContain('OGA');
  });

  it("passes when E01 is COMPLETADO and all areas have cmn_adjunto='SI'", () => {
    const e01 = makeEtapa('E01', {
      estado: 'COMPLETADO',
      filas: [
        makeFilaArea({ area_usuaria: 'DTDIS', cmn_adjunto: 'SI' }),
        makeFilaArea({ area_usuaria: 'OGA', cmn_adjunto: 'SI' }),
      ],
    });
    const e02 = makeEtapa('E02');
    const result = getEtapaActionability(e02, [e01, e02]);
    expect(result.canRegister).toBe(true);
    expect(result.blockedReason).toBeNull();
  });
});

// ----------------------------------------------------------------
// R6 — E05/E06: require E04 COMPLETADO
// ----------------------------------------------------------------

describe("getEtapaActionability — R6 (E05/E06 bucle TDR / E04)", () => {
  it("E05 blocked when E04 absent", () => {
    const e05 = makeEtapa('E05');
    const result = getEtapaActionability(e05, [e05]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toMatch(/E04/);
  });

  it("E05 blocked when E04 not COMPLETADO", () => {
    const e04 = makeEtapa('E04', { estado: 'EN_CURSO' });
    const e05 = makeEtapa('E05');
    const result = getEtapaActionability(e05, [e04, e05]);
    expect(result.canRegister).toBe(false);
  });

  it("E05 unblocked when E04 COMPLETADO", () => {
    const e04 = makeEtapa('E04', { estado: 'COMPLETADO' });
    const e05 = makeEtapa('E05');
    const result = getEtapaActionability(e05, [e04, e05]);
    expect(result.canRegister).toBe(true);
  });

  it("E06 blocked when E04 not COMPLETADO", () => {
    const e04 = makeEtapa('E04', { estado: 'PENDIENTE' });
    const e06 = makeEtapa('E06');
    const result = getEtapaActionability(e06, [e04, e06]);
    expect(result.canRegister).toBe(false);
  });

  it("E06 unblocked when E04 COMPLETADO", () => {
    const e04 = makeEtapa('E04', { estado: 'COMPLETADO' });
    const e06 = makeEtapa('E06');
    const result = getEtapaActionability(e06, [e04, e06]);
    expect(result.canRegister).toBe(true);
  });
});

// ----------------------------------------------------------------
// R7 — E09: requires E08 COMPLETADO
// ----------------------------------------------------------------

describe("getEtapaActionability — R7 (E09 / E08)", () => {
  it("E09 blocked when E08 absent", () => {
    const e09 = makeEtapa('E09');
    const result = getEtapaActionability(e09, [e09]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toMatch(/E08/);
  });

  it("E09 blocked when E08 not COMPLETADO", () => {
    const e08 = makeEtapa('E08', { estado: 'EN_CURSO' });
    const e09 = makeEtapa('E09');
    const result = getEtapaActionability(e09, [e08, e09]);
    expect(result.canRegister).toBe(false);
  });

  it("E09 unblocked when E08 COMPLETADO", () => {
    const e08 = makeEtapa('E08', { estado: 'COMPLETADO' });
    const e09 = makeEtapa('E09');
    const result = getEtapaActionability(e09, [e08, e09]);
    expect(result.canRegister).toBe(true);
  });
});

// ----------------------------------------------------------------
// R3 — E12: all E11 areas must be COMPLETADO (not PENDIENTE)
// ----------------------------------------------------------------

describe("getEtapaActionability — R3 (E12 / E11 per-area)", () => {
  it("E12 blocked when E11 has a PENDIENTE area", () => {
    const e11 = makeEtapa('E11', {
      estado: 'COMPLETADO',
      filas: [
        makeFilaArea({ area_usuaria: 'DTDIS', estado_etapa: 'COMPLETADO' }),
        makeFilaArea({ area_usuaria: 'OGA', estado_etapa: 'PENDIENTE' }),
      ],
    });
    const e12 = makeEtapa('E12');
    const result = getEtapaActionability(e12, [e11, e12]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toContain('OGA');
  });

  it("E12 unblocked when all E11 areas are COMPLETADO", () => {
    const e11 = makeEtapa('E11', {
      estado: 'COMPLETADO',
      filas: [
        makeFilaArea({ area_usuaria: 'DTDIS', estado_etapa: 'COMPLETADO' }),
        makeFilaArea({ area_usuaria: 'OGA', estado_etapa: 'COMPLETADO' }),
      ],
    });
    const e12 = makeEtapa('E12');
    const result = getEtapaActionability(e12, [e11, e12]);
    expect(result.canRegister).toBe(true);
  });
});

// ----------------------------------------------------------------
// R5 — E25: all E24 areas must be COMPLETADO (not PENDIENTE)
// ----------------------------------------------------------------

describe("getEtapaActionability — R5 (E25 / E24 per-area)", () => {
  it("E25 blocked when E24 has a PENDIENTE area", () => {
    const e24 = makeEtapa('E24', {
      estado: 'COMPLETADO',
      filas: [
        makeFilaArea({ area_usuaria: 'DTDIS', estado_etapa: 'COMPLETADO' }),
        makeFilaArea({ area_usuaria: 'ALMACEN', estado_etapa: 'PENDIENTE' }),
      ],
    });
    const e25 = makeEtapa('E25');
    const result = getEtapaActionability(e25, [e24, e25]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toContain('ALMACEN');
  });

  it("E25 unblocked when all E24 areas are COMPLETADO", () => {
    const e24 = makeEtapa('E24', {
      estado: 'COMPLETADO',
      filas: [
        makeFilaArea({ area_usuaria: 'DTDIS', estado_etapa: 'COMPLETADO' }),
        makeFilaArea({ area_usuaria: 'ALMACEN', estado_etapa: 'COMPLETADO' }),
      ],
    });
    const e25 = makeEtapa('E25');
    const result = getEtapaActionability(e25, [e24, e25]);
    expect(result.canRegister).toBe(true);
  });
});
