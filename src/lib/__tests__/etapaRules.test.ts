/**
 * C3b WU-F6 — etapaRules.ts tests.
 * Pure function tests — no DOM, no React, fast.
 * Verifies each prerequisite rule (R1/R3/R5/R6/R7) blocks and unblocks correctly.
 */

import { describe, it, expect } from "vitest";
import { getEtapaActionability, PREREQUISITOS } from "@/lib/etapaRules";
import { ETAPAS_CONFIG, CODIGOS_CON_ADJUNTOS } from "@/lib/constants";
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
  // E03 now has prereq E02 in C3c — verify it is blocked when E02 absent
  it("E03 now has prereq E02 (C3c) → blocked when E02 absent", () => {
    const etapa = makeEtapa('E03');
    const result = getEtapaActionability(etapa, [etapa]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toMatch(/E02/);
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

// ----------------------------------------------------------------
// C3c — Main chain prerequisite extension (D7)
// ----------------------------------------------------------------

describe("getEtapaActionability — C3c main chain", () => {
  // PREREQUISITOS map contains the new chain pairs
  it("PREREQUISITOS contains E03:['E02']", () => {
    expect(PREREQUISITOS['E03']).toEqual(['E02']);
  });

  it("PREREQUISITOS contains E04:['E03']", () => {
    expect(PREREQUISITOS['E04']).toEqual(['E03']);
  });

  it("PREREQUISITOS contains E07:['E04']", () => {
    expect(PREREQUISITOS['E07']).toEqual(['E04']);
  });

  it("PREREQUISITOS contains E08:['E07']", () => {
    expect(PREREQUISITOS['E08']).toEqual(['E07']);
  });

  it("PREREQUISITOS contains E10:['E09']", () => {
    expect(PREREQUISITOS['E10']).toEqual(['E09']);
  });

  it("PREREQUISITOS contains E11:['E10']", () => {
    expect(PREREQUISITOS['E11']).toEqual(['E10']);
  });

  it("PREREQUISITOS contains E13:['E12']", () => {
    expect(PREREQUISITOS['E13']).toEqual(['E12']);
  });

  it("PREREQUISITOS contains E14:['E13']", () => {
    expect(PREREQUISITOS['E14']).toEqual(['E13']);
  });

  it("PREREQUISITOS contains E17:['E16']", () => {
    expect(PREREQUISITOS['E17']).toEqual(['E16']);
  });

  it("PREREQUISITOS contains E24:['E23']", () => {
    expect(PREREQUISITOS['E24']).toEqual(['E23']);
  });

  // Optional loops NOT in chain — existing prereqs unchanged
  it("PREREQUISITOS E05 stays as ['E04'] (loop, not in chain)", () => {
    expect(PREREQUISITOS['E05']).toEqual(['E04']);
  });

  it("PREREQUISITOS E08a stays as ['E08'] (loop, not in chain)", () => {
    expect(PREREQUISITOS['E08a']).toEqual(['E08']);
  });

  // Functional: E03 blocked when E02 not COMPLETADO (SC-02)
  it("E03 blocked when E02 not COMPLETADO", () => {
    const e02 = makeEtapa('E02', { estado: 'EN_CURSO' });
    const e03 = makeEtapa('E03');
    const result = getEtapaActionability(e03, [e02, e03]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toMatch(/E02/);
  });

  it("E03 unblocked when E02 COMPLETADO", () => {
    const e02 = makeEtapa('E02', { estado: 'COMPLETADO' });
    const e03 = makeEtapa('E03');
    const result = getEtapaActionability(e03, [e02, e03]);
    expect(result.canRegister).toBe(true);
  });

  // E07 blocked when E04 not COMPLETADO; loops (E05/E06) absence is irrelevant
  it("E07 blocked when E04 not COMPLETADO", () => {
    const e04 = makeEtapa('E04', { estado: 'EN_CURSO' });
    const e07 = makeEtapa('E07');
    const result = getEtapaActionability(e07, [e04, e07]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toMatch(/E04/);
  });

  it("E07 unblocked when E04 COMPLETADO even without E05/E06 (SC-03)", () => {
    // E05/E06 are absent (not in allEtapas) — should not block E07
    const e04 = makeEtapa('E04', { estado: 'COMPLETADO' });
    const e07 = makeEtapa('E07');
    const result = getEtapaActionability(e07, [e04, e07]);
    expect(result.canRegister).toBe(true);
  });

  // blockMessage for new chain pairs uses generic fallback
  it("blockMessage for E07:E04 contains 'E04'", () => {
    const e04 = makeEtapa('E04', { estado: 'PENDIENTE' });
    const e07 = makeEtapa('E07');
    const result = getEtapaActionability(e07, [e04, e07]);
    expect(result.blockedReason).toMatch(/E04/);
  });

  // Late-chain stage: E14 blocked when E13 not COMPLETADO (SC-09)
  it("E14 blocked when E13 not COMPLETADO (SC-09)", () => {
    const e13 = makeEtapa('E13', { estado: 'PENDIENTE' });
    const e14 = makeEtapa('E14');
    const result = getEtapaActionability(e14, [e13, e14]);
    expect(result.canRegister).toBe(false);
    expect(result.blockedReason).toMatch(/E13/);
  });
});

// ----------------------------------------------------------------
// C3c — catalog sync: CODIGOS_CON_ADJUNTOS matches ETAPAS_CONFIG
// ----------------------------------------------------------------

describe("C3c catalog sync — CODIGOS_CON_ADJUNTOS", () => {
  it("ETAPAS_CONFIG has exactly 12 entries with acepta_adjuntos=true", () => {
    const fromConfig = new Set(
      (ETAPAS_CONFIG as readonly { cod: string; acepta_adjuntos?: boolean }[])
        .filter((e) => e.acepta_adjuntos === true)
        .map((e) => e.cod)
    );
    expect(fromConfig.size).toBe(12);
    expect(CODIGOS_CON_ADJUNTOS.size).toBe(12);
    // Both sets must be identical
    for (const cod of fromConfig) {
      expect(CODIGOS_CON_ADJUNTOS.has(cod)).toBe(true);
    }
    for (const cod of CODIGOS_CON_ADJUNTOS) {
      expect(fromConfig.has(cod)).toBe(true);
    }
  });

  it("CODIGOS_CON_ADJUNTOS contains all 12 expected key stage codes", () => {
    const expected = ['E01','E02','E03','E07','E09','E11','E13','E14','E15','E16','E19','E24'];
    for (const cod of expected) {
      expect(CODIGOS_CON_ADJUNTOS.has(cod)).toBe(true);
    }
  });

  it("CODIGOS_CON_ADJUNTOS does NOT contain non-key stages", () => {
    const nonKey = ['E04','E05','E06','E08','E08a','E08b','E10','E12','E17','E18','E20','E21','E22','E23','E25'];
    for (const cod of nonKey) {
      expect(CODIGOS_CON_ADJUNTOS.has(cod)).toBe(false);
    }
  });
});
