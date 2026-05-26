"use client";

/**
 * LineaEtapasHorizontal — Horizontal stage-flow for a selected acquisition.
 * Shows COMPLETADO + EN_CURSO non-loop stages connected left-to-right with chevrons.
 * Each card: actor badge, días count, stage code + name, start date.
 */

import React from "react";
import { useEtapas } from "@/hooks/useEtapas";
import { COLORES_ACTOR } from "@/lib/constants";
import { formatFechaCorta } from "@/lib/fecha";
import type { EtapaAgrupada } from "@/types/etapa";

interface LineaEtapasHorizontalProps {
  procesoId: number | null;
}

function EtapaFlowCard({ etapa }: { etapa: EtapaAgrupada }) {
  const actorKey = etapa.area_responsable as keyof typeof COLORES_ACTOR;
  const color = COLORES_ACTOR[actorKey] ?? COLORES_ACTOR.OTIN;
  const primeraFila = etapa.filas[0] ?? null;
  const dias = primeraFila?.dias ?? null;
  const fechaInicio = primeraFila?.fecha_inicio ?? null;

  return (
    <article
      className="flex-shrink-0 w-40 rounded-lg p-3 flex flex-col gap-1.5"
      style={{
        backgroundColor: color.bg,
        border: `1px solid ${color.border}`,
      }}
      aria-label={`Etapa ${etapa.cod}: ${etapa.nombre}`}
    >
      {/* Actor badge */}
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded self-start"
        style={{ backgroundColor: color.border, color: color.text }}
      >
        {etapa.area_responsable}
      </span>

      {/* Days — big number */}
      <div
        className="text-2xl font-bold leading-none"
        style={{ color: color.text }}
        aria-label={`${dias ?? "—"} días`}
      >
        {dias !== null ? dias : "—"}
        <span className="text-sm font-medium ml-1">días</span>
      </div>

      {/* Stage code + truncated name */}
      <div className="flex flex-col gap-0.5">
        <span
          className="text-xs font-mono font-bold"
          style={{ color: color.text }}
        >
          {etapa.cod}
        </span>
        <span
          className="text-xs leading-tight line-clamp-2"
          style={{ color: color.text }}
          title={etapa.nombre}
        >
          {etapa.nombre}
        </span>
      </div>

      {/* Start date */}
      <span className="text-xs mt-auto" style={{ color: color.text, opacity: 0.8 }}>
        {formatFechaCorta(fechaInicio)}
      </span>
    </article>
  );
}

export function LineaEtapasHorizontal({ procesoId }: LineaEtapasHorizontalProps) {
  const { data, isLoading, isError } = useEtapas(procesoId ?? 0);

  if (!procesoId) {
    return (
      <div className="bg-white border border-outline rounded-lg p-6 text-center text-gray-400 text-sm">
        Seleccione una adquisición para ver su flujo de etapas.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="bg-white border border-outline rounded-lg p-6 text-center text-gray-400 text-sm"
        role="status"
        aria-live="polite"
      >
        Cargando etapas…
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm"
        role="alert"
      >
        Error al cargar las etapas del proceso.
      </div>
    );
  }

  const etapas = data?.etapas ?? [];
  const etapasVisibles = etapas.filter(
    (e) =>
      !e.es_bucle &&
      (e.estado === "COMPLETADO" || e.estado === "EN_CURSO")
  );

  if (etapasVisibles.length === 0) {
    return (
      <div className="bg-white border border-outline rounded-lg p-6 text-center text-gray-400 text-sm">
        Sin etapas iniciadas para esta adquisición.
      </div>
    );
  }

  const totalDias = etapasVisibles.reduce(
    (sum, e) => sum + (e.filas[0]?.dias ?? 0),
    0
  );

  return (
    <div className="bg-white border border-outline shadow-card rounded-lg p-4">
      <div className="overflow-x-auto">
        <div
          className="flex items-center gap-2 pb-2"
          style={{ minWidth: "max-content" }}
          role="list"
          aria-label="Flujo de etapas"
        >
          {etapasVisibles.map((etapa, idx) => (
            <React.Fragment key={etapa.cod}>
              <div role="listitem">
                <EtapaFlowCard etapa={etapa} />
              </div>
              {idx < etapasVisibles.length - 1 && (
                <span
                  className="text-gray-400 font-bold text-lg flex-shrink-0"
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </React.Fragment>
          ))}

          {/* Total días pill */}
          <div className="flex-shrink-0 ml-4 bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 flex flex-col items-center gap-0.5">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total
            </span>
            <span className="text-xl font-bold text-primary">{totalDias}</span>
            <span className="text-xs text-gray-500">días</span>
          </div>
        </div>
      </div>
    </div>
  );
}
