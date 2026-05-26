/**
 * C4 — Fase config mirrors backend FASES dict in etapas_catalogo.py.
 * Colors match COLORES_ACTOR / institutional palette from design #152.
 */

export const FASES_CONFIG = [
  { fase: "F1", label: "Requerimiento y TDR",         color: "#1f3864" },
  { fase: "F2", label: "Indagación y Evaluación",      color: "#7B1FA2" },
  { fase: "F3", label: "Presupuesto y Certificación",  color: "#BF360C" },
  { fase: "F4", label: "Orden y Ejecución",            color: "#0D47A1" },
  { fase: "F5", label: "Conformidad",                  color: "#276221" },
] as const;

export type FaseKey = (typeof FASES_CONFIG)[number]["fase"];
