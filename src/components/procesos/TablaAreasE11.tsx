"use client";

/**
 * TablaAreasE11 — per-area certification table for E11.
 *
 * - One row per area in areasUsuarias
 * - Columns: Area, Monto Cert. S/., Estado, Fecha, Acciones
 * - Footer shows running total of monto_cert
 * - POST if no existing row; PUT if row exists
 * Spec §J
 */

import React, { useState } from "react";
import type { FilaArea } from "@/types/etapa";
import { useRegistrarEtapa, useActualizarEtapa } from "@/hooks/useEtapas";
import { useAuthStore } from "@/stores/authStore";
import { COLORES_ESTADO } from "@/lib/constants";
import { getDiasDemoraArea } from "@/lib/etapaRules";
import { formatFechaCorta } from "@/lib/fecha";
import { AdjuntosEtapa } from "./AdjuntosEtapa";

interface TablaAreasE11Props {
  procesoId: number;
  filas: FilaArea[];
  areasUsuarias: string[];
  /** Start of the chain for this stage (previous stage end) — used for días de demora. */
  fechaInicioChain?: string | null;
}

interface RowState {
  montoCert: string;
  fecha: string;
  editing: boolean;
}

export function TablaAreasE11({
  procesoId,
  filas,
  areasUsuarias,
  fechaInicioChain = null,
}: TablaAreasE11Props) {
  const { mutate: registrar, isPending: isRegistrando } = useRegistrarEtapa(procesoId);
  const { mutate: actualizar, isPending: isActualizando } = useActualizarEtapa(procesoId);
  const { user } = useAuthStore();
  const canEdit = user?.rol === "ADMIN" || user?.rol === "EDITOR";

  // Local row state for editing
  const [rowState, setRowState] = useState<Record<string, RowState>>(() => {
    const state: Record<string, RowState> = {};
    for (const area of areasUsuarias) {
      const fila = filas.find((f) => f.area_usuaria === area);
      state[area] = {
        montoCert: fila?.monto_cert?.toString() ?? '',
        fecha: fila?.fecha_inicio ?? '',
        editing: false,
      };
    }
    return state;
  });

  function setEditing(area: string, editing: boolean) {
    setRowState((prev) => {
      const current = prev[area] ?? { montoCert: '', fecha: '', editing: false };
      return { ...prev, [area]: { ...current, editing } satisfies RowState };
    });
  }

  function updateField(area: string, field: 'montoCert' | 'fecha', value: string) {
    setRowState((prev) => {
      const current = prev[area] ?? { montoCert: '', fecha: '', editing: false };
      return { ...prev, [area]: { ...current, [field]: value } satisfies RowState };
    });
  }

  function handleSave(area: string) {
    const existingFila = filas.find((f) => f.area_usuaria === area);
    const currentRow = rowState[area];
    if (!currentRow) return;
    const monto = parseFloat(currentRow.montoCert);
    const fecha = currentRow.fecha;

    if (isNaN(monto) || monto <= 0 || !fecha) return;

    if (existingFila) {
      actualizar(
        {
          etapaId: existingFila.id,
          payload: {
            monto_cert: monto,
            fecha_inicio: fecha,
            estado_etapa: 'COMPLETADO',
          },
        },
        { onSuccess: () => setEditing(area, false) }
      );
    } else {
      registrar(
        {
          codigo_etapa: 'E11',
          nombre_etapa: 'Solicitud cert. presupuestal (cada Area - OTIN)',
          fecha_inicio: fecha,
          estado_etapa: 'COMPLETADO',
          area_usuaria: area,
          monto_cert: monto,
        },
        { onSuccess: () => setEditing(area, false) }
      );
    }
  }

  // Running total from existing filas + local edits that have values
  const runningTotal = areasUsuarias.reduce((acc, area) => {
    const montoCert = rowState[area]?.montoCert ?? '';
    const val = parseFloat(montoCert);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const isSaving = isRegistrando || isActualizando;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" aria-label="Certificaciones presupuestales por area">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Area</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Monto Cert. S/.</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600">Estado</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Fecha</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600">Días demora</th>
              <th className="py-2 px-3 text-xs font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {areasUsuarias.map((area) => {
              const fila = filas.find((f) => f.area_usuaria === area);
              const row: RowState = rowState[area] ?? { montoCert: '', fecha: '', editing: false };
              const estado = fila?.estado_etapa ?? 'PENDIENTE';
              const estadoKey = (estado === 'EN_CURSO' ? 'EN_CURSO' : estado === 'COMPLETADO' ? 'COMPLETADO' : 'PENDIENTE') as keyof typeof COLORES_ESTADO;
              const estadoColor = COLORES_ESTADO[estadoKey];
              const diasDemora = getDiasDemoraArea(
                fila?.fecha_inicio ?? null,
                fechaInicioChain
              );

              return (
                <React.Fragment key={area}>
                <tr
                  className="border-b border-gray-100 hover:bg-gray-50"
                  data-testid={`e11-row-${area}`}
                >
                  <td className="py-2 px-3 font-medium text-gray-700">{area}</td>

                  <td className="py-2 px-3 text-right">
                    {row.editing ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.montoCert}
                        onChange={(e) => updateField(area, 'montoCert', e.target.value)}
                        className="w-28 border border-gray-300 rounded px-2 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-300"
                        aria-label={`Monto certificado para ${area}`}
                      />
                    ) : (
                      <span data-testid={`e11-monto-${area}`}>
                        {row.montoCert
                          ? `S/ ${parseFloat(row.montoCert).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </span>
                    )}
                  </td>

                  <td className="py-2 px-3 text-center">
                    <span
                      className="text-xs px-2 py-0.5 rounded-lg font-medium"
                      style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
                    >
                      {estado}
                    </span>
                  </td>

                  <td className="py-2 px-3">
                    {row.editing ? (
                      <input
                        type="date"
                        value={row.fecha}
                        min={fechaInicioChain ?? undefined}
                        onChange={(e) => updateField(area, 'fecha', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                        aria-label={`Fecha para ${area}`}
                      />
                    ) : (
                      <span>{formatFechaCorta(fila?.fecha_inicio)}</span>
                    )}
                  </td>

                  <td className="py-2 px-3 text-center text-gray-700">
                    {diasDemora !== null ? `${diasDemora} d` : '—'}
                  </td>

                  <td className="py-2 px-3">
                    {row.editing ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleSave(area)}
                          disabled={isSaving}
                          className="text-xs px-2 py-0.5 rounded bg-green-600 text-white disabled:opacity-50"
                        >
                          {isSaving ? '...' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(area, false)}
                          className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditing(area, true)}
                        className="text-xs px-2 py-0.5 rounded border border-blue-300 text-blue-700 hover:bg-blue-50"
                        aria-label={fila ? `Editar ${area}` : `Registrar ${area}`}
                      >
                        {fila ? 'Editar' : 'Registrar'}
                      </button>
                    )}
                  </td>
                </tr>
                {/* C3c — Adjuntos expansion row per area (E11 is a key stage) */}
                <tr className="bg-gray-50">
                  <td colSpan={6} className="pb-2 px-3">
                    <AdjuntosEtapa
                      etapaId={fila?.id ?? 0}
                      canEdit={canEdit}
                    />
                  </td>
                </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="py-2 px-3 text-xs font-bold text-gray-700" colSpan={1}>
                Total
              </td>
              <td className="py-2 px-3 text-right text-sm font-bold text-gray-800" data-testid="e11-total">
                S/ {runningTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
