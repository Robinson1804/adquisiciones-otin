"use client";

/**
 * TablaAreasE24 — per-area conformity table for E24.
 *
 * - One row per area in areasUsuarias
 * - Columns: Area, Fecha conformidad, Dias demora, Estado, Acciones
 * - POST if no existing row; PUT if row exists
 * Spec §J
 */

import React, { useState } from "react";
import type { FilaArea } from "@/types/etapa";
import { useRegistrarEtapa, useActualizarEtapa } from "@/hooks/useEtapas";
import { COLORES_ESTADO } from "@/lib/constants";

interface TablaAreasE24Props {
  procesoId: number;
  filas: FilaArea[];
  areasUsuarias: string[];
}

interface RowState {
  fecha: string;
  editing: boolean;
}

function calcDiasDemora(fechaConformidad: string | null): number | null {
  if (!fechaConformidad) return null;
  const fecha = new Date(fechaConformidad);
  const hoy = new Date();
  const diff = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

export function TablaAreasE24({
  procesoId,
  filas,
  areasUsuarias,
}: TablaAreasE24Props) {
  const { mutate: registrar, isPending: isRegistrando } = useRegistrarEtapa(procesoId);
  const { mutate: actualizar, isPending: isActualizando } = useActualizarEtapa(procesoId);

  const [rowState, setRowState] = useState<Record<string, RowState>>(() => {
    const state: Record<string, RowState> = {};
    for (const area of areasUsuarias) {
      const fila = filas.find((f) => f.area_usuaria === area);
      state[area] = {
        fecha: fila?.fecha_inicio ?? '',
        editing: false,
      };
    }
    return state;
  });

  function setEditing(area: string, editing: boolean) {
    setRowState((prev) => {
      const current = prev[area] ?? { fecha: '', editing: false };
      return { ...prev, [area]: { ...current, editing } satisfies RowState };
    });
  }

  function updateFecha(area: string, value: string) {
    setRowState((prev) => {
      const current = prev[area] ?? { fecha: '', editing: false };
      return { ...prev, [area]: { ...current, fecha: value } satisfies RowState };
    });
  }

  function handleSave(area: string) {
    const existingFila = filas.find((f) => f.area_usuaria === area);
    const fecha = rowState[area]?.fecha ?? '';
    if (!fecha) return;

    if (existingFila) {
      actualizar(
        {
          etapaId: existingFila.id,
          payload: {
            fecha_inicio: fecha,
            estado_etapa: 'COMPLETADO',
          },
        },
        { onSuccess: () => setEditing(area, false) }
      );
    } else {
      registrar(
        {
          codigo_etapa: 'E24',
          nombre_etapa: 'Conformidad area usuaria [por area] (Areas - OTIN)',
          fecha_inicio: fecha,
          estado_etapa: 'COMPLETADO',
          area_usuaria: area,
        },
        { onSuccess: () => setEditing(area, false) }
      );
    }
  }

  const isSaving = isRegistrando || isActualizando;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" aria-label="Conformidades por area">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Area</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Fecha conformidad</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600">Dias demora</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600">Estado</th>
              <th className="py-2 px-3 text-xs font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {areasUsuarias.map((area) => {
              const fila = filas.find((f) => f.area_usuaria === area);
              const row: RowState = rowState[area] ?? { fecha: '', editing: false };
              const estado = fila?.estado_etapa ?? 'PENDIENTE';
              const estadoKey = (estado === 'COMPLETADO' ? 'COMPLETADO' : estado === 'EN_CURSO' ? 'EN_CURSO' : 'PENDIENTE') as keyof typeof COLORES_ESTADO;
              const estadoColor = COLORES_ESTADO[estadoKey];
              const diasDemora = calcDiasDemora(fila?.fecha_inicio ?? null);

              return (
                <tr
                  key={area}
                  className="border-b border-gray-100 hover:bg-gray-50"
                  data-testid={`e24-row-${area}`}
                >
                  <td className="py-2 px-3 font-medium text-gray-700">{area}</td>

                  <td className="py-2 px-3">
                    {row.editing ? (
                      <input
                        type="date"
                        value={row.fecha}
                        onChange={(e) => updateFecha(area, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                        aria-label={`Fecha conformidad para ${area}`}
                      />
                    ) : (
                      <span>
                        {fila?.fecha_inicio
                          ? new Date(fila.fecha_inicio).toLocaleDateString('es-PE')
                          : '—'}
                      </span>
                    )}
                  </td>

                  <td className="py-2 px-3 text-center text-gray-700">
                    {diasDemora !== null ? `${diasDemora} d` : '—'}
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
                        aria-label={`Editar conformidad ${area}`}
                      >
                        {fila ? 'Editar' : 'Registrar'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
