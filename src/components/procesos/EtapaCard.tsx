"use client";

/**
 * EtapaCard — renders a single etapa in the timeline.
 *
 * - Border/bg from COLORES_ACTOR[area_responsable]
 * - Dashed border for BUCLE stages (Spec §H)
 * - Estado badge from COLORES_ESTADO
 * - "Registrar avance" button visible to EDITOR/ADMIN only
 * - Prerequisite not met → button disabled + tooltip (UI-only defense; C3b enforces on backend)
 * - E16: red alert badge when alerta_otpp = true
 * - E21: indicator "Inicio del plazo del servicio/bien" when COMPLETADO
 */

import React from "react";
import { COLORES_ACTOR, COLORES_ESTADO } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";
import type { EtapaAgrupada } from "@/types/etapa";
import type { EtapaActionability } from "@/lib/etapaRules";
import { getLatestRonda } from "@/lib/etapaRules";
import { AlertaE16 } from "./AlertaE16";
import { RondasList } from "./RondasList";
import { useReiniciarTdr } from "@/hooks/useEtapas";

interface EtapaCardProps {
  etapa: EtapaAgrupada;
  allEtapas: EtapaAgrupada[];
  procesoId: number;
  procesoEstado?: string;
  actionability: EtapaActionability;
  onRegistrar: () => void;
}

function EstadoBadge({ estado }: { estado: string }) {
  const key = estado as keyof typeof COLORES_ESTADO;
  const color = COLORES_ESTADO[key] ?? COLORES_ESTADO.PENDIENTE;
  const label =
    estado === 'EN_CURSO' ? 'En Curso' :
    estado === 'COMPLETADO' ? 'Completado' :
    estado === 'PENDIENTE' ? 'Pendiente' :
    estado === 'OMITIDO' ? 'Omitido' :
    estado;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-lg whitespace-nowrap"
      style={{ backgroundColor: color.bg, color: color.text }}
      aria-label={`Estado: ${label}`}
    >
      {label}
    </span>
  );
}

export function EtapaCard({
  etapa,
  allEtapas,
  procesoId,
  procesoEstado,
  actionability,
  onRegistrar,
}: EtapaCardProps) {
  const { user } = useAuthStore();
  const puedeEscribir = user?.rol === 'ADMIN' || user?.rol === 'EDITOR';

  // WU-F3: Reiniciar TDR — only shown on E10 card when proceso is CANCELADO due to SIN_PRESUPUESTO
  const reiniciarMutation = useReiniciarTdr(procesoId);
  const esCanceladoPorSinPresupuesto =
    etapa.cod === 'E10' &&
    procesoEstado === 'CANCELADO' &&
    etapa.filas.some((f) => f.resultado_eval === 'SIN_PRESUPUESTO');
  const [reiniciarError, setReiniciarError] = React.useState<string | null>(null);

  // Actor colors from constants — fallback to OTIN if unknown actor key
  const actorKey = etapa.area_responsable as keyof typeof COLORES_ACTOR;
  const actorColor = COLORES_ACTOR[actorKey] ?? COLORES_ACTOR.OTIN;
  const isBucle = etapa.es_bucle;
  const latestRonda = getLatestRonda(etapa);

  // Border style: dashed for BUCLE stages
  const borderStyle: React.CSSProperties = {
    backgroundColor: actorColor.bg,
    borderColor: actorColor.border,
    borderStyle: isBucle ? 'dashed' : 'solid',
    borderWidth: '1px',
  };

  // Determine display date info from first fila (simple stages)
  const primeraFila = etapa.filas[0] ?? null;
  const fechaInicio = primeraFila?.fecha_inicio ?? null;
  const fechaFin = primeraFila?.fecha_fin ?? null;
  const dias = primeraFila?.dias ?? null;

  return (
    <article
      className="rounded-lg p-3 relative"
      style={borderStyle}
      aria-label={`Etapa ${etapa.cod}: ${etapa.nombre}`}
      data-testid={`etapa-card-${etapa.cod}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* Code + name */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: actorColor.border, color: actorColor.text }}
            >
              {etapa.cod}
            </span>
            <span
              className="text-xs font-semibold truncate"
              style={{ color: actorColor.text }}
            >
              {etapa.nombre}
            </span>
          </div>

          {/* Estado badge + ronda badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <EstadoBadge estado={etapa.estado} />
            {isBucle && latestRonda !== null && (
              <span
                className="text-xs px-2 py-0.5 rounded-lg font-medium"
                style={{ backgroundColor: COLORES_ACTOR.BUCLE.bg, color: COLORES_ACTOR.BUCLE.text }}
              >
                Ronda {latestRonda}
              </span>
            )}
            {/* E16 alerta badge — WU-F2 */}
            {etapa.cod === 'E16' && (
              <AlertaE16 alerta_otpp={etapa.alerta_otpp} />
            )}
          </div>

          {/* E21 inicio del plazo indicator */}
          {etapa.cod === 'E21' && etapa.estado === 'COMPLETADO' && (
            <div
              className="text-xs mt-1 font-medium"
              style={{ color: actorColor.text }}
              aria-label="Inicio del plazo del servicio/bien"
            >
              Inicio del plazo del servicio/bien
            </div>
          )}

          {/* Date info for non-loop, non-per-area stages */}
          {!isBucle && !etapa.por_area && (
            <div className="flex gap-3 text-xs mt-0.5" style={{ color: actorColor.text }}>
              {fechaInicio && (
                <span>
                  Inicio:{' '}
                  {new Date(fechaInicio).toLocaleDateString('es-PE', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                  })}
                </span>
              )}
              {fechaFin && (
                <span>
                  Fin:{' '}
                  {new Date(fechaFin).toLocaleDateString('es-PE', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                  })}
                </span>
              )}
              {dias !== null && <span>{dias} d</span>}
            </div>
          )}

          {/* Per-area summary */}
          {etapa.por_area && etapa.filas.length > 0 && (
            <div className="text-xs mt-0.5" style={{ color: actorColor.text }}>
              {etapa.filas.length} area{etapa.filas.length !== 1 ? 's' : ''} registrada{etapa.filas.length !== 1 ? 's' : ''}
              {etapa.monto_total !== null && (
                <span className="ml-2 font-semibold">
                  Total: S/ {etapa.monto_total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Registrar avance button — EDITOR/ADMIN only */}
        {puedeEscribir && (
          <div className="relative group flex-shrink-0">
            <button
              onClick={actionability.canRegister ? onRegistrar : undefined}
              disabled={!actionability.canRegister}
              className="text-xs px-2 py-1 rounded border font-medium transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: actorColor.border,
                color: actorColor.text,
                backgroundColor: 'white',
              }}
              aria-label={
                actionability.canRegister
                  ? `Registrar avance de ${etapa.cod}`
                  : `${etapa.cod} bloqueado: ${actionability.blockedReason ?? ''}`
              }
              aria-disabled={!actionability.canRegister}
            >
              {actionability.canRegister ? 'Registrar' : 'Bloqueado'}
            </button>
            {/* Tooltip for blocked stages */}
            {!actionability.canRegister && actionability.blockedReason && (
              <div
                className="absolute right-0 top-full mt-1 z-10 hidden group-hover:block
                           bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap max-w-xs"
                role="tooltip"
              >
                {actionability.blockedReason}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WU-F3: Reiniciar TDR — E10 card when proceso CANCELADO por SIN_PRESUPUESTO */}
      {puedeEscribir && esCanceladoPorSinPresupuesto && (
        <div className="mt-2 flex flex-col gap-1">
          <button
            onClick={() => {
              setReiniciarError(null);
              reiniciarMutation.mutate(undefined, {
                onError: (err) => {
                  const msg = (err as { response?: { data?: { detail?: string } } })
                    ?.response?.data?.detail;
                  setReiniciarError(msg ?? 'No se pudo reiniciar el TDR');
                },
              });
            }}
            disabled={reiniciarMutation.isPending}
            className="text-xs px-3 py-1.5 rounded border font-medium transition-colors
                       border-orange-400 text-orange-700 bg-orange-50
                       hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reiniciar TDR: reabrir E02 en nueva ronda"
          >
            {reiniciarMutation.isPending ? 'Reiniciando...' : 'Reiniciar TDR (nueva ronda)'}
          </button>
          {reiniciarError && (
            <p className="text-xs text-red-600" role="alert">{reiniciarError}</p>
          )}
        </div>
      )}

      {/* Rondas list for bucle stages */}
      {isBucle && (
        <div className="mt-2">
          <RondasList
            rondas={etapa.rondas}
            procesoId={procesoId}
            cod={etapa.cod}
            canAddRonda={actionability.canRegister && puedeEscribir}
            blockedReason={actionability.blockedReason}
          />
        </div>
      )}
    </article>
  );
}
