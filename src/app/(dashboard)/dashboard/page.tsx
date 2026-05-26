"use client";

/**
 * S7 — Dashboard Principal (/dashboard)
 * C4: 5 metric cards + process grid with 5-phase MiniTimeline.
 * Replaces C1 placeholder.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useMetricas, useFlujoProcesos } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MiniTimeline } from "@/components/dashboard/MiniTimeline";
import { SelectorAnno } from "@/components/dashboard/SelectorAnno";
import { COLORES_ESTADO } from "@/lib/constants";
import type { EstadoProceso } from "@/types";

const CURRENT_YEAR = new Date().getFullYear();

const ESTADO_COLOR_MAP: Record<EstadoProceso, keyof typeof COLORES_ESTADO> = {
  "EN PROCESO": "EN_CURSO",
  CULMINADO: "COMPLETADO",
  CANCELADO: "CANCELADO",
};

function EstadoBadge({ estado }: { estado: string }) {
  const key = ESTADO_COLOR_MAP[estado as EstadoProceso] ?? "OMITIDO";
  const color = COLORES_ESTADO[key] ?? COLORES_ESTADO.OMITIDO;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-lg whitespace-nowrap"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {estado}
    </span>
  );
}

const fmt = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const [anno, setAnno] = useState(CURRENT_YEAR);

  const metricas = useMetricas(anno);
  const flujo = useFlujoProcesos(anno);

  const m = metricas.data;
  const procesos = flujo.data?.procesos ?? [];

  // Format pim_total safely
  const pimStr = m?.pim_total != null ? fmt.format(m.pim_total) : "—";
  const diasStr = m?.dias_promedio != null ? `${m.dias_promedio.toFixed(1)} días` : "—";

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-primary">
          Dashboard Adquisiciones TIC
        </h1>
        <div className="flex items-center gap-4">
          <SelectorAnno value={anno} onChange={setAnno} />
          <Link
            href="/presentacion"
            className="text-xs border border-primary text-primary rounded px-3 py-1.5
                       hover:bg-primary hover:text-white transition-colors"
          >
            Modo Presentación
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      {metricas.isError && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm" role="alert">
          Error al cargar métricas. Verifique su conexión.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Total Procesos"  value={m?.total ?? "—"} />
        <MetricCard label="En Proceso"      value={m?.en_proceso ?? "—"} />
        <MetricCard label="Culminados"      value={m?.culminados ?? "—"} />
        <MetricCard label="Cancelados"      value={m?.cancelados ?? "—"} />
        <MetricCard label="PIM Total"       value={pimStr} />
        <MetricCard label="Días Promedio"   value={diasStr} sub="procesos culminados" />
      </div>

      {/* Sub-nav to reports */}
      <div className="flex gap-2 flex-wrap">
        {[
          { href: "/reportes/tiempos",     label: "Análisis de Tiempos" },
          { href: "/reportes/presupuesto", label: "Análisis Presupuestal" },
          { href: "/reportes/areas",       label: "Trazabilidad Áreas" },
        ].map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="text-xs border border-outline rounded px-3 py-1.5
                       hover:bg-surface-content transition-colors text-gray-600"
          >
            {r.label}
          </Link>
        ))}
      </div>

      {/* Process grid */}
      {flujo.isLoading && (
        <div className="text-center text-gray-500 text-sm py-8" role="status" aria-live="polite">
          Cargando procesos…
        </div>
      )}

      {flujo.isError && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm" role="alert">
          Error al cargar el flujo de procesos.
        </div>
      )}

      {!flujo.isLoading && !flujo.isError && procesos.length === 0 && (
        <div className="bg-white border border-outline rounded-lg p-12 text-center">
          <p className="text-gray-400 text-sm">
            Sin datos para <strong>{anno}</strong>. Seleccione otro año o registre procesos.
          </p>
        </div>
      )}

      {procesos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {procesos.map((proceso) => (
            <div
              key={proceso.id}
              className="bg-white border border-outline shadow-card rounded-lg p-4 flex flex-col gap-3"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gray-500">{proceso.id_proceso}</p>
                  <p
                    className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2"
                    title={proceso.requerimiento}
                  >
                    {proceso.requerimiento}
                  </p>
                </div>
                <EstadoBadge estado={proceso.estado} />
              </div>

              {/* Mini timeline */}
              <MiniTimeline fases={proceso.fases} porcentaje={proceso.porcentaje} />

              {/* Footer link */}
              <div className="flex justify-end">
                <Link
                  href={`/procesos/${proceso.id}`}
                  className="text-xs text-primary font-medium hover:underline"
                  aria-label={`Ver detalle del proceso ${proceso.id_proceso}`}
                >
                  Ver detalle →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
