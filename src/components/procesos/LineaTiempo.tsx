"use client";

/**
 * LineaTiempo — renders the 27-stage timeline for a proceso.
 *
 * - Calls useEtapas(procesoId)
 * - Maps over etapas (already in ORDEN_ETAPAS order from backend)
 * - Renders one EtapaCard per entry
 * - Bucle stages show collapsed rondas list within the card
 * - Shows loading skeleton and inline error
 * Spec §H, Design §FRONTEND
 */

import React, { useState } from "react";
import { useEtapas } from "@/hooks/useEtapas";
import { EtapaCard } from "./EtapaCard";
import { ModalRegistroEtapa } from "./ModalRegistroEtapa";
import { getEtapaActionability, getFechaInicioSugerida } from "@/lib/etapaRules";
import { COLORES_ESTADO } from "@/lib/constants";
import type { EtapaAgrupada } from "@/types/etapa";

interface LineaTiempoProps {
  procesoId: number;
  areasUsuarias?: string[];
  /** C3b: passed to EtapaCard to enable Reiniciar-TDR button on E10 when CANCELADO */
  procesoEstado?: string;
}

const LEYENDA: { label: string; key: keyof typeof COLORES_ESTADO }[] = [
  { label: 'Completado', key: 'COMPLETADO' },
  { label: 'En Curso', key: 'EN_CURSO' },
  { label: 'Pendiente', key: 'PENDIENTE' },
];

function SkeletonCard() {
  return (
    <div className="rounded-lg p-3 border border-gray-200 bg-gray-50 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-2 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

export function LineaTiempo({ procesoId, areasUsuarias = [], procesoEstado }: LineaTiempoProps) {
  const { data, isLoading, isError, error } = useEtapas(procesoId);

  const [modalEtapa, setModalEtapa] = useState<EtapaAgrupada | null>(null);

  if (isLoading) {
    return (
      <div
        className="bg-white border border-outline shadow-card rounded-lg p-6 h-full"
        aria-label="Panel de etapas del proceso"
        role="status"
        aria-live="polite"
      >
        <h2 className="text-base font-bold text-primary mb-4">
          Linea de Tiempo del Proceso
        </h2>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="bg-white border border-outline shadow-card rounded-lg p-6 h-full"
        role="alert"
      >
        <h2 className="text-base font-bold text-primary mb-4">
          Linea de Tiempo del Proceso
        </h2>
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Error al cargar las etapas.'}
        </p>
      </div>
    );
  }

  const { etapas, progreso } = data;

  return (
    <div
      className="bg-white border border-outline shadow-card rounded-lg p-6 h-full flex flex-col gap-4"
      aria-label="Panel de etapas del proceso"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold text-primary">
          Linea de Tiempo del Proceso
        </h2>
        {/* Progress */}
        <div className="text-xs text-gray-600">
          <span className="font-semibold">{progreso.completadas}</span>/{progreso.total} etapas
          <span className="ml-2 font-semibold text-primary">
            {Math.round(progreso.porcentaje)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5" aria-label={`Progreso: ${Math.round(progreso.porcentaje)}%`}>
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progreso.porcentaje}%`, backgroundColor: '#4CAF50' }}
        />
      </div>

      {/* Etapa actual indicator */}
      {progreso.etapa_actual && (
        <div className="text-xs text-gray-600">
          Etapa actual: <span className="font-semibold font-mono">{progreso.etapa_actual}</span>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2" role="list" aria-label="Leyenda de estados">
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

      {/* Timeline cards */}
      <ol
        className="space-y-2 overflow-y-auto flex-1"
        aria-label="Etapas del proceso en orden"
      >
        {etapas.map((etapa) => {
          const actionability = getEtapaActionability(etapa, etapas);
          return (
            <li key={etapa.cod}>
              <EtapaCard
                etapa={etapa}
                allEtapas={etapas}
                procesoId={procesoId}
                procesoEstado={procesoEstado}
                actionability={actionability}
                onRegistrar={() => setModalEtapa(etapa)}
              />
            </li>
          );
        })}
      </ol>

      {/* Modal registro etapa */}
      {modalEtapa && (
        <ModalRegistroEtapa
          procesoId={procesoId}
          etapa={modalEtapa}
          open={true}
          onClose={() => setModalEtapa(null)}
          areasUsuarias={areasUsuarias}
          fechaInicioSugerida={getFechaInicioSugerida(modalEtapa.cod, etapas)}
        />
      )}
    </div>
  );
}
