"use client";

/**
 * S2 — Lista de Procesos (/procesos)
 * Metric cards + filter bar + paginated table with estado badges.
 * "Nuevo Proceso" button gated to EDITOR/ADMIN.
 */

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useProcesos } from "@/hooks/useProcesos";
import { COLORES_ESTADO } from "@/lib/constants";
import type { EstadoProceso, TipoProceso } from "@/types";

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();
const ANNO_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const ESTADO_BADGE_MAP: Record<
  EstadoProceso,
  keyof typeof COLORES_ESTADO
> = {
  "EN PROCESO": "EN_CURSO",
  CULMINADO: "COMPLETADO",
  CANCELADO: "CANCELADO",
};

// ----------------------------------------------------------------
// MetricCard
// ----------------------------------------------------------------
function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-outline shadow-card rounded-lg p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold text-primary">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

// ----------------------------------------------------------------
// EstadoBadge
// ----------------------------------------------------------------
function EstadoBadge({ estado }: { estado: EstadoProceso }) {
  const key = ESTADO_BADGE_MAP[estado];
  const color = COLORES_ESTADO[key];
  return (
    <span
      className="text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {estado}
    </span>
  );
}

// ----------------------------------------------------------------
// useDebounce — 300ms
// ----------------------------------------------------------------
function useDebounce(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);
  // Use a ref-based approach to avoid adding useEffect to the dep list
  const [, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handler = useCallback(
    (v: string) => {
      setTimer((prev) => {
        if (prev) clearTimeout(prev);
        return setTimeout(() => setDebounced(v), delay);
      });
    },
    [delay]
  );

  // Sync when value changes
  if (value !== debounced) {
    handler(value);
  }

  return debounced;
}

// ----------------------------------------------------------------
// Main page
// ----------------------------------------------------------------
export default function ProcesosPage() {
  const { user } = useAuthStore();
  const puedeEscribir =
    user?.rol === "ADMIN" || user?.rol === "EDITOR";

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [estado, setEstado] = useState<EstadoProceso | "">("");
  const [tipo, setTipo] = useState<TipoProceso | "">("");
  const [anno, setAnno] = useState<number | "">(CURRENT_YEAR);
  const [page, setPage] = useState(1);

  const search = useDebounce(searchInput);

  // Reset page on filter change
  const handleFilterChange = useCallback(() => setPage(1), []);

  // Main list query
  const filtros = {
    page,
    page_size: 20,
    ...(anno ? { anno } : {}),
    ...(estado ? { estado: estado as EstadoProceso } : {}),
    ...(tipo ? { tipo: tipo as TipoProceso } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError } = useProcesos(filtros);

  // Count queries for metric cards (page_size=1 → only need .total)
  const { data: enProcesoData } = useProcesos({
    estado: "EN PROCESO",
    page_size: 1,
    ...(anno ? { anno } : {}),
  });
  const { data: culminadoData } = useProcesos({
    estado: "CULMINADO",
    page_size: 1,
    ...(anno ? { anno } : {}),
  });
  const { data: canceladoData } = useProcesos({
    estado: "CANCELADO",
    page_size: 1,
    ...(anno ? { anno } : {}),
  });

  // Pagination helpers
  const totalItems = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;
  const pageSize = 20;
  const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">
          Adquisiciones TIC {anno || ""}
        </h1>
        {puedeEscribir && (
          <Link
            href="/procesos/nuevo"
            className="bg-primary text-white font-semibold px-4 py-2 rounded text-sm
                       hover:bg-primary-container transition-colors"
            aria-label="Crear nuevo proceso de adquisición"
          >
            + Nuevo Proceso
          </Link>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Total Procesos" value={data?.total ?? "—"} />
        <MetricCard
          label="En Proceso"
          value={enProcesoData?.total ?? "—"}
        />
        <MetricCard
          label="Culminados"
          value={culminadoData?.total ?? "—"}
        />
        <MetricCard
          label="Cancelados"
          value={canceladoData?.total ?? "—"}
        />
        <MetricCard
          label="PIM Total"
          value="—"
          sub="Disponible en C4"
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-outline shadow-card rounded-lg p-4 flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1 flex-1 min-w-48">
          <label htmlFor="search" className="text-xs font-medium text-gray-600">
            Buscar
          </label>
          <input
            id="search"
            type="text"
            placeholder="ID o requerimiento..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              handleFilterChange();
            }}
            className="border border-outline rounded px-3 py-2 text-sm focus:outline-none
                       focus:ring-2 focus:ring-primary/30"
            aria-label="Buscar por ID o requerimiento"
          />
        </div>

        {/* Estado */}
        <div className="flex flex-col gap-1">
          <label htmlFor="estado" className="text-xs font-medium text-gray-600">
            Estado
          </label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoProceso | "");
              handleFilterChange();
            }}
            className="border border-outline rounded px-3 py-2 text-sm focus:outline-none
                       focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos</option>
            <option value="EN PROCESO">EN PROCESO</option>
            <option value="CULMINADO">CULMINADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label htmlFor="tipo" className="text-xs font-medium text-gray-600">
            Tipo
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoProceso | "");
              handleFilterChange();
            }}
            className="border border-outline rounded px-3 py-2 text-sm focus:outline-none
                       focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos</option>
            <option value="BIEN">BIEN</option>
            <option value="SERVICIO">SERVICIO</option>
          </select>
        </div>

        {/* Año */}
        <div className="flex flex-col gap-1">
          <label htmlFor="anno" className="text-xs font-medium text-gray-600">
            Año
          </label>
          <select
            id="anno"
            value={anno}
            onChange={(e) => {
              setAnno(e.target.value ? Number(e.target.value) : "");
              handleFilterChange();
            }}
            className="border border-outline rounded px-3 py-2 text-sm focus:outline-none
                       focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos</option>
            {ANNO_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-outline shadow-card rounded-lg overflow-hidden">
        {isLoading && (
          <div
            className="p-8 text-center text-gray-500 text-sm"
            role="status"
            aria-live="polite"
          >
            Cargando procesos...
          </div>
        )}

        {isError && (
          <div
            className="p-8 text-center text-red-600 text-sm"
            role="alert"
          >
            Error al cargar los procesos. Verifique su conexión.
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="grid">
              <thead className="bg-table-header text-on-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">
                    Requerimiento
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">
                    Unidad
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide">
                    PIM
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">
                    Etapa Actual
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {data?.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-400 text-sm"
                    >
                      No se encontraron procesos con los filtros seleccionados.
                    </td>
                  </tr>
                )}
                {data?.items.map((proceso) => (
                  <tr
                    key={proceso.id}
                    className="hover:bg-surface-content transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {proceso.id_proceso}
                    </td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs">
                      <span title={proceso.requerimiento}>
                        {proceso.requerimiento.length > 60
                          ? proceso.requerimiento.slice(0, 60) + "…"
                          : proceso.requerimiento}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {proceso.tipo ? (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {proceso.tipo}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {proceso.unidad_resp ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 font-mono text-xs">
                      {proceso.pim
                        ? `S/ ${parseFloat(proceso.pim).toLocaleString("es-PE", {
                            minimumFractionDigits: 2,
                          })}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={proceso.estado} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      — {/* C3 */}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/procesos/${proceso.id}`}
                        className="text-primary text-xs font-medium hover:underline"
                        aria-label={`Ver detalle del proceso ${proceso.id_proceso}`}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!isLoading && !isError && totalItems > 0 && (
          <div className="px-4 py-3 border-t border-outline flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {fromItem}–{toItem} de {totalItems}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 rounded border border-outline text-xs disabled:opacity-40
                           hover:bg-surface-content transition-colors"
                aria-label="Página anterior"
              >
                ← Anterior
              </button>
              <span className="text-xs">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 rounded border border-outline text-xs disabled:opacity-40
                           hover:bg-surface-content transition-colors"
                aria-label="Página siguiente"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
