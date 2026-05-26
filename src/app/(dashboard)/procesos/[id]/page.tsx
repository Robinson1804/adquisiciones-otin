"use client";

/**
 * S4 — Detalle Proceso (/procesos/[id])
 * Left panel: ficha del proceso.
 * Right panel: LineaTiempo (timeline de las 27 etapas).
 */

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useProceso, useActualizarProceso } from "@/hooks/useProcesos";
import { useMontosProceso } from "@/hooks/useMontosProceso";
import { useExportProcesoPdf } from "@/hooks/useExport";
import { LineaTiempo } from "@/components/procesos/LineaTiempo";
import { COLORES_ESTADO, COLORES_ACTOR } from "@/lib/constants";
import type { EstadoProceso } from "@/types";

// ----------------------------------------------------------------
// Estado badge
// ----------------------------------------------------------------
const ESTADO_BADGE_MAP: Record<EstadoProceso, keyof typeof COLORES_ESTADO> = {
  "EN PROCESO": "EN_CURSO",
  CULMINADO: "COMPLETADO",
  CANCELADO: "CANCELADO",
};

function EstadoBadge({ estado }: { estado: EstadoProceso }) {
  const key = ESTADO_BADGE_MAP[estado];
  const color = COLORES_ESTADO[key];
  return (
    <span
      className="text-xs font-medium px-2 py-1 rounded-lg"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {estado}
    </span>
  );
}

// ----------------------------------------------------------------
// Ficha field row
// ----------------------------------------------------------------
function FichaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-800">{children}</dd>
    </div>
  );
}

// ----------------------------------------------------------------
// Tiempo transcurrido helper
// ----------------------------------------------------------------
function diasTranscurridos(fechaCreacion: string): number {
  const inicio = new Date(fechaCreacion);
  const hoy = new Date();
  const diff = hoy.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ----------------------------------------------------------------
// Main page
// ----------------------------------------------------------------
export default function DetalleProceso() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const puedeEscribir = user?.rol === "ADMIN" || user?.rol === "EDITOR";

  const procesoId = Number(params.id);
  const { data: proceso, isLoading, isError } = useProceso(
    Number.isFinite(procesoId) && procesoId > 0 ? procesoId : null
  );

  // C3b WU-F4 — montos del proceso (populated as trigger stages complete)
  const { data: montos } = useMontosProceso(
    Number.isFinite(procesoId) && procesoId > 0 ? procesoId : null
  );

  const { mutate: actualizarProceso, isPending: isUpdating } =
    useActualizarProceso();

  // C5 — PDF export
  const {
    trigger: downloadPdf,
    isLoading: isExportingPdf,
    error: pdfExportError,
  } = useExportProcesoPdf();

  // Simple inline edit state
  const [editMode, setEditMode] = useState(false);
  const [editReq, setEditReq] = useState("");

  function handleEdit() {
    setEditReq(proceso?.requerimiento ?? "");
    setEditMode(true);
  }

  function handleSave() {
    if (!proceso) return;
    actualizarProceso(
      { id: proceso.id, payload: { requerimiento: editReq } },
      { onSuccess: () => setEditMode(false) }
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-20 text-gray-500 text-sm"
        role="status"
        aria-live="polite"
      >
        Cargando proceso...
      </div>
    );
  }

  // Error / Not found
  if (isError || !proceso) {
    return (
      <div
        className="max-w-md mx-auto mt-16 bg-white border border-outline shadow-card rounded-lg p-8 text-center"
        role="alert"
      >
        <p className="text-gray-700 font-semibold mb-2">Proceso no encontrado</p>
        <p className="text-sm text-gray-500 mb-6">
          El proceso que buscás no existe o fue eliminado.
        </p>
        <Link
          href="/procesos"
          className="text-primary text-sm font-medium hover:underline"
        >
          ← Volver a Procesos
        </Link>
      </div>
    );
  }

  const dias = diasTranscurridos(proceso.fecha_creacion);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 flex items-center gap-1" aria-label="Migas de pan">
        <Link href="/procesos" className="text-primary hover:underline">
          Procesos
        </Link>
        <span>/</span>
        <span className="font-mono">{proceso.id_proceso}</span>
        <span>/</span>
        <span>Detalle</span>
      </nav>

      {/* Title row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary font-mono">
            {proceso.id_proceso}
          </h1>
          <EstadoBadge estado={proceso.estado} />
        </div>
        <div className="flex items-center gap-2">
          {/* C5 — PDF export: available to all authenticated roles */}
          <button
            onClick={() => void downloadPdf(proceso.id, proceso.id_proceso)}
            disabled={isExportingPdf}
            className="border border-outline text-primary font-semibold px-4 py-1.5 rounded text-sm
                       hover:bg-surface-content transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Exportar proceso ${proceso.id_proceso} a PDF`}
          >
            {isExportingPdf ? "Exportando..." : "Exportar PDF"}
          </button>
          {puedeEscribir && !editMode && (
            <button
              onClick={handleEdit}
              className="px-4 py-1.5 bg-white border border-outline rounded text-sm text-gray-700
                         hover:bg-surface-content transition-colors"
              aria-label="Editar proceso"
            >
              Editar
            </button>
          )}
        </div>
      </div>
      {/* C5 — PDF export error feedback */}
      {pdfExportError && (
        <p className="text-sm text-red-600" role="alert">
          {pdfExportError}
        </p>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Ficha */}
        <div className="bg-white border border-outline shadow-card rounded-lg p-6">
          <h2 className="text-sm font-bold text-primary mb-4 border-b border-outline pb-2">
            Ficha del Proceso
          </h2>

          <dl className="space-y-4">
            {/* Requerimiento — editable */}
            <FichaRow label="Requerimiento">
              {editMode ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editReq}
                    onChange={(e) => setEditReq(e.target.value)}
                    className="w-full border border-outline rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    aria-label="Editar requerimiento"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isUpdating}
                      className="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary-container disabled:opacity-50"
                    >
                      {isUpdating ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-3 py-1 border border-outline text-xs rounded hover:bg-surface-content"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <span>{proceso.requerimiento}</span>
              )}
            </FichaRow>

            <FichaRow label="Tipo">
              {proceso.tipo ? (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {proceso.tipo}
                </span>
              ) : (
                "—"
              )}
            </FichaRow>

            <FichaRow label="Unidad Solicitante">
              {proceso.unidad_resp ?? "—"}
            </FichaRow>

            <FichaRow label="Año">{proceso.anno ?? "—"}</FichaRow>

            <FichaRow label="Presupuesto Institucional (PIM)">
              {proceso.pim
                ? `S/ ${parseFloat(proceso.pim).toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}`
                : "—"}
            </FichaRow>

            {/* C3b WU-F4 — Valor EM (from E09 COMPLETADO via montos_proceso) */}
            <FichaRow label="Valor EM">
              {montos?.valor_em != null
                ? `S/ ${montos.valor_em.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </FichaRow>

            {/* C3b WU-F4 — N° OCS + Monto OCS (from E19 COMPLETADO) */}
            <FichaRow label="N° OCS">
              {montos?.nro_ocs ?? '—'}
            </FichaRow>

            {montos?.monto_ocs != null && (
              <FichaRow label="Monto OCS">
                {`S/ ${montos.monto_ocs.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </FichaRow>
            )}

            {montos?.plazo_entrega != null && (
              <FichaRow label="Plazo Entrega">
                {`${montos.plazo_entrega} días`}
              </FichaRow>
            )}

            {montos?.fecha_inicio_srv && (
              <FichaRow label="Inicio del Servicio">
                {new Date(montos.fecha_inicio_srv).toLocaleDateString('es-PE', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </FichaRow>
            )}

            <FichaRow label="Tiempo Transcurrido">
              {dias === 0
                ? "Hoy"
                : `${dias} día${dias !== 1 ? "s" : ""}`}
            </FichaRow>

            <FichaRow label="Fecha de Creación">
              {new Date(proceso.fecha_creacion).toLocaleDateString("es-PE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </FichaRow>

            <FichaRow label="Creado por">{proceso.creado_por ?? "—"}</FichaRow>

            {/* Áreas usuarias */}
            {proceso.areas_usuarias && proceso.areas_usuarias.length > 0 && (
              <FichaRow label="Dependencias Involucradas">
                <div className="flex flex-wrap gap-1 mt-1">
                  {proceso.areas_usuarias.map((area) => {
                    const color =
                      COLORES_ACTOR[area as keyof typeof COLORES_ACTOR] ??
                      COLORES_ACTOR.OTIN;
                    return (
                      <span
                        key={area}
                        className="text-xs px-2 py-0.5 rounded border font-medium"
                        style={{
                          backgroundColor: color.bg,
                          color: color.text,
                          borderColor: color.border,
                        }}
                      >
                        {area}
                      </span>
                    );
                  })}
                </div>
              </FichaRow>
            )}

            {/* Motivo cancelación */}
            {proceso.estado === "CANCELADO" && proceso.motivo_cancel && (
              <FichaRow label="Motivo Cancelación">
                <span className="text-red-700">{proceso.motivo_cancel}</span>
              </FichaRow>
            )}

            {/* Documentos placeholder */}
            <FichaRow label="Documentos de Referencia">
              <span className="text-gray-400 text-xs">— Disponible próximamente</span>
            </FichaRow>
          </dl>
        </div>

        {/* Right: Timeline — C3a/C3b */}
        <LineaTiempo
          procesoId={proceso.id}
          areasUsuarias={proceso.areas_usuarias ?? []}
          procesoEstado={proceso.estado}
        />
      </div>
    </div>
  );
}
