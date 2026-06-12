"use client";

// ============================================================
// LineaTiempo — dos modos:
//   · "mapa"  → MapaProceso (board de 5 fases, overview)
//   · "foco"  → FocoEtapa (nav lateral + panel de edición)
//
// Click en una etapa del Mapa: selecciona la etapa y cambia a Foco.
// En Foco: edición inline (simple) o modal delegado (por_area/bucle).
// ============================================================
import React, { useState } from "react";
import { useEtapas } from "@/hooks/useEtapas";
import { ModalRegistroEtapa } from "./ModalRegistroEtapa";
import { MapaProceso } from "./MapaProceso";
import { FocoEtapa } from "./FocoEtapa";
import { getFechaInicioSugerida } from "@/lib/etapaRules";
import type { EtapaAgrupada } from "@/types/etapa";

interface LineaTiempoProps {
  procesoId: number;
  areasUsuarias?: string[];
  /** C3b: passed through to FocoEtapa for Reiniciar-TDR logic on E10 when CANCELADO */
  procesoEstado?: string;
}

type Modo = "mapa" | "foco";

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
  const [modo, setModo] = useState<Modo>("mapa");
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<EtapaAgrupada | null>(null);
  // Modal directo desde el mapa (cuando la etapa es accionable y el usuario hace clic en "Registrar avance")
  const [modalEtapa, setModalEtapa] = useState<EtapaAgrupada | null>(null);

  if (isLoading) {
    return (
      <div
        className="bg-white border border-outline shadow-card rounded-lg p-6 h-full"
        aria-label="Panel de etapas del proceso"
        role="status"
        aria-live="polite"
      >
        <h2 className="text-base font-bold text-primary mb-4">Registro de Etapas</h2>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
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
        <h2 className="text-base font-bold text-primary mb-4">Registro de Etapas</h2>
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Error al cargar las etapas."}
        </p>
      </div>
    );
  }

  const { etapas, progreso } = data;

  /** Click desde el Mapa: siempre va a Foco con la etapa seleccionada */
  function handleSelectFromMapa(etapa: EtapaAgrupada) {
    setEtapaSeleccionada(etapa);
    setModo("foco");
  }

  /** Cerrar Foco: vuelve al Mapa y limpia selección */
  function handleCloseFoco() {
    setEtapaSeleccionada(null);
    setModo("mapa");
  }

  /** Toggle desde el botón Foco sin etapa previa: va a Foco con etapa_actual o null */
  function handleSwitchToFoco() {
    if (etapaSeleccionada === null && progreso.etapa_actual) {
      const actual = etapas.find((e) => e.cod === progreso.etapa_actual) ?? null;
      setEtapaSeleccionada(actual);
    }
    setModo("foco");
  }

  const titulo = modo === "mapa" ? "Mapa del Proceso" : "Registro de Etapas";

  return (
    <div
      className="bg-white border border-outline shadow-card rounded-lg p-6 h-full flex flex-col gap-4"
      aria-label="Panel de etapas del proceso"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-bold text-primary">{titulo}</h2>
        <div className="flex items-center gap-3">
          {/* Toggle Mapa / Foco */}
          <div
            className="flex gap-0.5 bg-gray-100 border border-outline rounded-lg p-0.5"
            role="tablist"
            aria-label="Modo de vista"
          >
            <button
              key="mapa"
              role="tab"
              aria-selected={modo === "mapa"}
              onClick={() => {
                setModo("mapa");
                // Mantener etapaSeleccionada para si vuelven a Foco
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition capitalize
                ${modo === "mapa" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Mapa
            </button>
            <button
              key="foco"
              role="tab"
              aria-selected={modo === "foco"}
              onClick={handleSwitchToFoco}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition capitalize
                ${modo === "foco" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Foco
            </button>
          </div>
          {/* Progreso */}
          <div className="text-xs text-gray-600">
            <span className="font-semibold">{progreso.completadas}</span>/{progreso.total} etapas
            <span className="ml-2 font-semibold text-primary">{Math.round(progreso.porcentaje)}%</span>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div
        className="w-full bg-gray-100 rounded-full h-1.5"
        aria-label={`Progreso: ${Math.round(progreso.porcentaje)}%`}
      >
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progreso.porcentaje}%`, backgroundColor: "#16A34A" }}
        />
      </div>

      {/* ====== Vista MAPA ====== */}
      {modo === "mapa" && (
        <MapaProceso etapas={etapas} progreso={progreso} onSelect={handleSelectFromMapa} />
      )}

      {/* ====== Vista FOCO ====== */}
      {modo === "foco" && (
        <FocoEtapa
          procesoId={procesoId}
          etapas={etapas}
          progreso={progreso}
          etapaSeleccionada={etapaSeleccionada}
          onSelectEtapa={setEtapaSeleccionada}
          onClose={handleCloseFoco}
          areasUsuarias={areasUsuarias}
          procesoEstado={procesoEstado}
        />
      )}

      {/* Modal registro (sólo si se dispara desde algún sub-componente vía setModalEtapa) */}
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
