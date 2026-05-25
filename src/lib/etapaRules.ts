/**
 * etapaRules.ts — Pure functions for etapa prerequisite/actionability logic.
 *
 * C3a: permissive — returns true (actionable) for all stages.
 * C3b: will tighten prerequisite enforcement using ETAPAS_CONFIG.prerequisitos.
 *
 * KEEP THIS AS A PURE FUNCTION over etapas data so C3b can extend without
 * rewriting the UI components.
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
 * Mirrors ETAPAS_CONFIG prerequisitos from backend (Design D1).
 * C3b will use this to enforce strict blocking.
 */
const PREREQUISITOS: Record<string, string[]> = {
  E02: ['E01'],
  E05: ['E04'],
  E06: ['E04'],
  E09: ['E08'],
  E12: ['E11'],
  E25: ['E24'],
};

/**
 * Returns actionability for a given stage given the full list of etapas.
 *
 * C3a: Checks prerequisite stages are COMPLETADO (UI-only defense).
 * The backend is the source of truth — this is defense-in-depth only.
 *
 * C3b: Will call validaciones.py equivalent logic here.
 */
export function getEtapaActionability(
  etapa: EtapaAgrupada,
  allEtapas: EtapaAgrupada[]
): EtapaActionability {
  const prereqs = PREREQUISITOS[etapa.cod] ?? [];

  for (const prereqCod of prereqs) {
    const prereqEtapa = allEtapas.find((e) => e.cod === prereqCod);
    if (!prereqEtapa || prereqEtapa.estado !== 'COMPLETADO') {
      return {
        canRegister: false,
        blockedReason: `${prereqCod} debe estar COMPLETADO antes de registrar ${etapa.cod}`,
      };
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
