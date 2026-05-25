/**
 * EtapasPanelPlaceholder — C2 right-panel placeholder.
 * C3 will replace the body of this component with the real timeline.
 * The outer card structure must remain stable so C3 can slot in without
 * structural changes.
 */

import React from "react";
import { COLORES_ESTADO } from "@/lib/constants";

const LEYENDA: { label: string; key: keyof typeof COLORES_ESTADO }[] = [
  { label: "Completado", key: "COMPLETADO" },
  { label: "En Curso", key: "EN_CURSO" },
  { label: "Pendiente", key: "PENDIENTE" },
];

export function EtapasPanelPlaceholder() {
  return (
    <div
      className="bg-white border border-outline shadow-card rounded-lg p-6 h-full"
      aria-label="Panel de etapas del proceso"
    >
      <h2 className="text-base font-bold text-primary mb-4">
        Línea de Tiempo del Proceso
      </h2>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 mb-6" role="list" aria-label="Leyenda de estados">
        {LEYENDA.map(({ label, key }) => {
          const color = COLORES_ESTADO[key];
          return (
            <span
              key={key}
              role="listitem"
              className="text-xs font-medium px-2 py-1 rounded-lg"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {label}
            </span>
          );
        })}
      </div>

      {/* Placeholder body — replaced by C3 */}
      <div
        className="flex flex-col items-center justify-center text-center py-10 text-gray-400"
        role="status"
        aria-live="polite"
      >
        <svg
          className="w-12 h-12 mb-3 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm font-medium text-gray-500">
          El seguimiento de etapas estará disponible próximamente
        </p>
        <p className="text-xs mt-1 text-gray-400">(C3)</p>
      </div>
    </div>
  );
}
