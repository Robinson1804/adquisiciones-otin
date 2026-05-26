/**
 * etapaRules.ts — Pure functions for etapa prerequisite/actionability logic.
 *
 * C3a: permissive — returns true (actionable) for all stages.
 * C3b: tightened — encodes R1/R6/R7/E12/E25 prerequisite logic per Design §LAS 8 REGLAS.
 * C3c: extends PREREQUISITOS to the full main chain (D7). EtapaCard stays unchanged.
 *
 * KEEP THIS AS A PURE FUNCTION over etapas data so UI components stay decoupled.
 * Backend is the source of truth (returns 409); this is defense-in-depth / UX.
 */

import type { EtapaAgrupada } from "@/types/etapa";

export interface EtapaActionability {
  /** Whether the stage can be registered/advanced */
  canRegister: boolean;
  /** Human-readable reason when canRegister is false */
  blockedReason: string | null;
}

/**
 * Map of prerequisite relationships.
 * Mirrors etapas_catalogo.py prerequisitos from backend (Design D1).
 * C3b: extended with R6/R7 and E08a/E08b.
 * C3c: extended with the full main chain (D7).
 *
 * Main chain: E01→E02→E03→E04→E07→E08→E09→E10→E11→E12→E13→E14→E15
 *             →E16→E17→E18→E19→E20→E21→E22→E23→E24→E25
 * Optional loops (NOT in chain): E05/E06←E04, E08a/E08b←E08
 */
export const PREREQUISITOS: Record<string, string[]> = {
  // Main chain (C3c — each requires the previous chain stage COMPLETADO)
  E02: ['E01'],       // R1 — also checks all E01 cmn_adjunto='SI'
  E03: ['E02'],
  E04: ['E03'],
  E07: ['E04'],
  E08: ['E07'],
  E09: ['E08'],       // R7 — BE also checks resultado_eval=APROBADO
  E10: ['E09'],
  E11: ['E10'],
  E12: ['E11'],       // R3 — all E11 areas must be COMPLETADO
  E13: ['E12'],
  E14: ['E13'],
  E15: ['E14'],
  E16: ['E15'],
  E17: ['E16'],
  E18: ['E17'],
  E19: ['E18'],
  E20: ['E19'],
  E21: ['E20'],
  E22: ['E21'],
  E23: ['E22'],
  E24: ['E23'],
  E25: ['E24'],       // R5 — all E24 areas must be COMPLETADO
  // Optional loops (anchor to chain stages; do NOT block main chain)
  E05: ['E04'],       // R6 — E04 must be COMPLETADO
  E06: ['E04'],       // R6
  E08a: ['E08'],
  E08b: ['E08'],
};

/**
 * Human-readable block messages per (cod, prereqCod) pair.
 * Mirrors the Spanish messages from backend validaciones.py (Design §LAS 8 REGLAS).
 */
const BLOCK_MESSAGES: Record<string, string> = {
  'E02:E01': 'Todas las áreas deben tener CMN = SI antes de iniciar E02',
  'E05:E04': 'E04 debe estar COMPLETADO antes de iniciar bucle TDR (E05/E06)',
  'E06:E04': 'E04 debe estar COMPLETADO antes de iniciar bucle TDR (E05/E06)',
  'E08a:E08': 'E08 debe estar COMPLETADO antes de registrar E08a',
  'E08b:E08': 'E08 debe estar COMPLETADO antes de registrar E08b',
  'E09:E08': 'E08 debe tener resultado APROBADO antes de registrar E09',
  'E12:E11': 'Todas las áreas deben completar certificación presupuestal (E11) antes de consolidar',
  'E25:E24': 'Todas las áreas deben registrar conformidad (E24) antes de finalizar',
};

function blockMessage(cod: string, prereqCod: string): string {
  return BLOCK_MESSAGES[`${cod}:${prereqCod}`] ?? `${prereqCod} debe estar COMPLETADO antes de registrar ${cod}`;
}

/**
 * C3b — Returns actionability for a given stage given the full list of etapas.
 *
 * Encodes:
 * - R1: E02 blocked when any E01 fila has cmn_adjunto != 'SI'
 * - R6: E05/E06 blocked when E04 not COMPLETADO
 * - R7: E09 blocked when E08 not COMPLETADO
 * - R3/R5: E12/E25 blocked when per-area rows have PENDIENTE entries
 * - Generic prereq: any stage in PREREQUISITOS
 *
 * Backend is the source of truth — this is defense-in-depth (UX only).
 */
export function getEtapaActionability(
  etapa: EtapaAgrupada,
  allEtapas: EtapaAgrupada[]
): EtapaActionability {
  const prereqs = PREREQUISITOS[etapa.cod] ?? [];

  for (const prereqCod of prereqs) {
    const prereqEtapa = allEtapas.find((e) => e.cod === prereqCod);

    // Prereq stage not found or not completed
    if (!prereqEtapa || prereqEtapa.estado !== 'COMPLETADO') {
      return {
        canRegister: false,
        blockedReason: blockMessage(etapa.cod, prereqCod),
      };
    }

    // R1: E02 — additionally check all E01 filas have cmn_adjunto='SI'
    if (etapa.cod === 'E02' && prereqCod === 'E01') {
      const sinCmn = (prereqEtapa.filas ?? []).filter(
        (f) => f.cmn_adjunto !== 'SI'
      );
      if (sinCmn.length > 0) {
        const areas = sinCmn.map((f) => f.area_usuaria).join(', ');
        return {
          canRegister: false,
          blockedReason: `CMN pendiente en áreas: ${areas}`,
        };
      }
    }

    // R3: E12 — check no E11 filas are PENDIENTE
    if (etapa.cod === 'E12' && prereqCod === 'E11') {
      const pendientes = (prereqEtapa.filas ?? []).filter(
        (f) => f.estado_etapa === 'PENDIENTE'
      );
      if (pendientes.length > 0) {
        const areas = pendientes.map((f) => f.area_usuaria).join(', ');
        return {
          canRegister: false,
          blockedReason: `No se puede consolidar: áreas E11 pendientes: ${areas}`,
        };
      }
    }

    // R5: E25 — check no E24 filas are PENDIENTE
    if (etapa.cod === 'E25' && prereqCod === 'E24') {
      const pendientes = (prereqEtapa.filas ?? []).filter(
        (f) => f.estado_etapa === 'PENDIENTE'
      );
      if (pendientes.length > 0) {
        const areas = pendientes.map((f) => f.area_usuaria).join(', ');
        return {
          canRegister: false,
          blockedReason: `No conformidad final: áreas E24 pendientes: ${areas}`,
        };
      }
    }
  }

  return { canRegister: true, blockedReason: null };
}

/**
 * Returns the latest nro_ronda for a bucle etapa.
 * Returns null if no rondas exist yet.
 */
export function getLatestRonda(etapa: EtapaAgrupada): number | null {
  if (!etapa.es_bucle || etapa.rondas.length === 0) return null;
  return Math.max(...etapa.rondas.map((r) => r.nro_ronda));
}

// ---------------------------------------------------------------------------
// Date chaining — stages are consecutive: a stage "starts" when the previous
// chain stage ended. Used to (a) prefill fecha_inicio of a new registration
// and (b) compute "días de demora" of per-area rows as (fecha − chain start).
// ISO date strings (YYYY-MM-DD) compare correctly with string ordering.
// ---------------------------------------------------------------------------

/** Latest end date of a stage: max(fecha_fin ?? fecha_inicio) across its filas. */
export function getFechaFinEtapa(etapa: EtapaAgrupada | undefined): string | null {
  if (!etapa) return null;
  const fechas = etapa.filas
    .map((f) => f.fecha_fin ?? f.fecha_inicio)
    .filter((d): d is string => !!d);
  if (fechas.length === 0) return null;
  return fechas.reduce((max, d) => (d > max ? d : max));
}

/** Latest date among a loop stage's rounds: max(fecha_fin ?? fecha_inicio). */
function getUltimaRondaFecha(etapa: EtapaAgrupada | undefined): string | null {
  if (!etapa || etapa.rondas.length === 0) return null;
  const fechas = etapa.rondas
    .map((r) => r.fecha_fin ?? r.fecha_inicio)
    .filter((d): d is string => !!d);
  if (fechas.length === 0) return null;
  return fechas.reduce((max, d) => (d > max ? d : max));
}

/**
 * Suggested start date for a stage = end date of its chain prerequisite(s).
 * Returns null for the root stage (E01) or when no prerequisite has a date yet.
 *
 * Indagación de mercado: la evaluación técnica (E07) "comienza a correr" desde el
 * envío/derivación normal (E04). Pero si hubo corrección del TDR (bucle E06), el
 * reloj arranca desde la ÚLTIMA corrección que mandó OTIN — así la demora de la
 * evaluación no arrastra el tiempo de las observaciones.
 */
export function getFechaInicioSugerida(
  cod: string,
  allEtapas: EtapaAgrupada[]
): string | null {
  const prereqs = PREREQUISITOS[cod] ?? [];
  let best: string | null = null;
  for (const pc of prereqs) {
    const fin = getFechaFinEtapa(allEtapas.find((e) => e.cod === pc));
    if (fin && (best === null || fin > best)) best = fin;
  }
  if (cod === "E07") {
    const ultimaCorreccion = getUltimaRondaFecha(
      allEtapas.find((e) => e.cod === "E06")
    );
    if (ultimaCorreccion && (best === null || ultimaCorreccion > best)) {
      best = ultimaCorreccion;
    }
  }
  return best;
}

/** Días de demora of a per-area row = (fecha del área − inicio encadenado). */
export function getDiasDemoraArea(
  fechaArea: string | null | undefined,
  chainStart: string | null
): number | null {
  if (!fechaArea || !chainStart) return null;
  const diff = Math.floor(
    (new Date(fechaArea).getTime() - new Date(chainStart).getTime()) / 86_400_000
  );
  return diff >= 0 ? diff : null;
}
