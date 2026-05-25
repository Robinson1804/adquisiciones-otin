"use client";

/**
 * S3 — Nuevo Proceso (/procesos/nuevo)
 * 4-section form: Identificación / Áreas / CMN / Presupuesto.
 * VIEWER is redirected on mount (role-gate).
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { useCrearProceso } from "@/hooks/useProcesos";

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();

const AREAS_VALIDAS = [
  "DTDIS",
  "GOBERNANZA",
  "INFRAESTRUCTURA",
  "OPERACIONES",
] as const;

// ----------------------------------------------------------------
// Zod schema — mirrors ProcesoCreate (backend Pydantic)
// ----------------------------------------------------------------
const cmnPorAreaSchema = z.object({
  area: z.string(),
  cmn_adjunto: z.enum(["SI", "NO"]),
});

const procesoSchema = z.object({
  requerimiento: z
    .string()
    .min(3, "El requerimiento debe tener al menos 3 caracteres"),
  tipo: z.enum(["BIEN", "SERVICIO"], {
    required_error: "Seleccioná el tipo de adquisición",
  }),
  unidad_resp: z.string().optional(),
  areas_usuarias: z
    .array(z.string())
    .min(1, "Debés seleccionar al menos un área usuaria"),
  pim: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().min(0, "El PIM no puede ser negativo").optional()
  ),
  anno: z.number().min(2020).max(2100),
  cmn_por_area: z.array(cmnPorAreaSchema),
});

type ProcesoFormValues = z.infer<typeof procesoSchema>;

// ----------------------------------------------------------------
// Section wrapper
// ----------------------------------------------------------------
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-outline shadow-card rounded-lg p-6 space-y-4">
      <h2 className="text-sm font-bold text-primary border-b border-outline pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ----------------------------------------------------------------
// Field error
// ----------------------------------------------------------------
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-600 mt-1" role="alert">
      {message}
    </p>
  );
}

// ----------------------------------------------------------------
// Main page
// ----------------------------------------------------------------
export default function NuevoProcesoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutate: crearProceso, isPending, error: mutationError } = useCrearProceso();

  // VIEWER guard
  useEffect(() => {
    if (user && user.rol === "VIEWER") {
      router.replace("/procesos");
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProcesoFormValues>({
    resolver: zodResolver(procesoSchema),
    defaultValues: {
      requerimiento: "",
      tipo: undefined,
      unidad_resp: "",
      areas_usuarias: [],
      pim: undefined,
      anno: CURRENT_YEAR,
      cmn_por_area: [],
    },
  });

  const areasSeleccionadas = watch("areas_usuarias");
  const cmnPorArea = watch("cmn_por_area");

  // Sync cmn_por_area when areas change
  useEffect(() => {
    const existing = cmnPorArea ?? [];
    const updated = (areasSeleccionadas ?? []).map((area) => {
      const prev = existing.find((c) => c.area === area);
      return { area, cmn_adjunto: prev?.cmn_adjunto ?? ("NO" as const) };
    });
    setValue("cmn_por_area", updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasSeleccionadas]);

  const allCmnSI =
    cmnPorArea.length > 0 && cmnPorArea.every((c) => c.cmn_adjunto === "SI");

  function toggleArea(area: string) {
    const current = areasSeleccionadas ?? [];
    if (current.includes(area)) {
      setValue(
        "areas_usuarias",
        current.filter((a) => a !== area)
      );
    } else {
      setValue("areas_usuarias", [...current, area]);
    }
  }

  function onSubmit(data: ProcesoFormValues) {
    crearProceso(
      {
        requerimiento: data.requerimiento,
        tipo: data.tipo,
        unidad_resp: data.unidad_resp ?? null,
        areas_usuarias: data.areas_usuarias,
        pim: data.pim ?? null,
        anno: data.anno,
        cmn_por_area: data.cmn_por_area.map((c) => ({
          area: c.area,
          cmn_adjunto: c.cmn_adjunto,
        })),
      },
      {
        onSuccess: (nuevo) => {
          router.push(`/procesos/${nuevo.id}`);
        },
      }
    );
  }

  // If VIEWER, render nothing while redirect fires
  if (user?.rol === "VIEWER") return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500" aria-label="Migas de pan">
        <span
          className="text-primary cursor-pointer hover:underline"
          onClick={() => router.push("/procesos")}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push("/procesos")}
        >
          Procesos
        </span>
        {" / "}
        <span>Nuevo Proceso</span>
      </nav>

      <h1 className="text-xl font-bold text-primary">Nuevo Proceso de Adquisición</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Section 1 — Identificación */}
        <SectionCard title="1. Identificación">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Proceso (read-only) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ID Proceso
              </label>
              <input
                type="text"
                disabled
                value="Se genera automáticamente"
                className="w-full border border-outline rounded px-3 py-2 text-sm bg-gray-50 text-gray-400"
                aria-label="ID de proceso — se genera automáticamente"
              />
            </div>

            {/* Año */}
            <div>
              <label
                htmlFor="anno"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Año <span className="text-red-500">*</span>
              </label>
              <input
                id="anno"
                type="number"
                {...register("anno", { valueAsNumber: true })}
                className="w-full border border-outline rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <FieldError message={errors.anno?.message} />
            </div>

            {/* Unidad Solicitante */}
            <div>
              <label
                htmlFor="unidad_resp"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Unidad Solicitante
              </label>
              <input
                id="unidad_resp"
                type="text"
                {...register("unidad_resp")}
                placeholder="Ej: OTIN"
                className="w-full border border-outline rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Tipo */}
            <div>
              <fieldset>
                <legend className="block text-xs font-medium text-gray-600 mb-2">
                  Tipo <span className="text-red-500">*</span>
                </legend>
                <div className="flex gap-4">
                  {(["BIEN", "SERVICIO"] as const).map((t) => (
                    <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        value={t}
                        {...register("tipo")}
                        className="accent-primary"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </fieldset>
              <FieldError message={errors.tipo?.message} />
            </div>
          </div>

          {/* Requerimiento */}
          <div>
            <label
              htmlFor="requerimiento"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Descripción del Requerimiento <span className="text-red-500">*</span>
            </label>
            <textarea
              id="requerimiento"
              rows={3}
              {...register("requerimiento")}
              placeholder="Describí el requerimiento de adquisición..."
              className="w-full border border-outline rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              aria-required="true"
            />
            <FieldError message={errors.requerimiento?.message} />
          </div>
        </SectionCard>

        {/* Section 2 — Áreas Usuarias */}
        <SectionCard title="2. Áreas Usuarias">
          <fieldset>
            <legend className="text-xs text-gray-500 mb-3">
              Seleccioná las áreas que participan en este proceso (mínimo 1)
            </legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Áreas usuarias">
              {AREAS_VALIDAS.map((area) => {
                const selected = (areasSeleccionadas ?? []).includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-700 border-outline hover:border-primary"
                    }`}
                    aria-pressed={selected}
                    aria-label={`Área ${area}`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.areas_usuarias?.message} />
          </fieldset>
        </SectionCard>

        {/* Section 3 — CMN por Área */}
        <SectionCard title="3. Validación CMN">
          {(areasSeleccionadas ?? []).length === 0 ? (
            <p className="text-xs text-gray-400">
              Seleccioná áreas usuarias para configurar el CMN por área.
            </p>
          ) : (
            <div className="space-y-3">
              {allCmnSI && (
                <div
                  className="bg-green-50 border border-green-200 rounded px-3 py-2 text-xs text-green-700"
                  role="status"
                >
                  Todas las áreas tienen CMN adjunto confirmado.
                </div>
              )}
              {(areasSeleccionadas ?? []).map((area, idx) => (
                <div
                  key={area}
                  className="flex items-center gap-4 border border-outline rounded px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700 w-36">{area}</span>
                  <Controller
                    control={control}
                    name={`cmn_por_area.${idx}.cmn_adjunto`}
                    render={({ field }) => (
                      <fieldset className="flex gap-4">
                        <legend className="sr-only">
                          CMN adjunto para {area}
                        </legend>
                        {(["SI", "NO"] as const).map((val) => (
                          <label
                            key={val}
                            className="flex items-center gap-1.5 text-sm cursor-pointer"
                          >
                            <input
                              type="radio"
                              value={val}
                              checked={field.value === val}
                              onChange={() => field.onChange(val)}
                              className="accent-primary"
                            />
                            {val === "SI" ? "CMN Adjunto" : "Sin CMN"}
                          </label>
                        ))}
                      </fieldset>
                    )}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400">
                Nota: el enforcement del CMN (bloqueo de avance a E02) se aplicará en C3.
              </p>
            </div>
          )}
        </SectionCard>

        {/* Section 4 — Presupuesto */}
        <SectionCard title="4. Presupuesto">
          <div className="max-w-xs">
            <label
              htmlFor="pim"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Presupuesto Institucional Modificado (PIM)
            </label>
            <div className="flex items-center border border-outline rounded overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
              <span className="bg-gray-50 border-r border-outline px-3 py-2 text-sm text-gray-500">
                S/
              </span>
              <input
                id="pim"
                type="number"
                step="0.01"
                min="0"
                {...register("pim")}
                placeholder="0.00"
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
                aria-label="Presupuesto Institucional Modificado en soles"
              />
            </div>
            <FieldError message={errors.pim?.message} />
          </div>
          <p className="text-xs text-gray-400">
            Al crear el proceso será redirigido automáticamente al detalle del proceso.
          </p>
        </SectionCard>

        {/* Mutation error */}
        {mutationError && (
          <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700" role="alert">
            Error al crear el proceso: {mutationError.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded border border-outline text-sm text-gray-700 hover:bg-surface-content transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-primary text-white font-semibold rounded text-sm
                       hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {isPending ? "Creando..." : "Crear Proceso"}
          </button>
        </div>
      </form>
    </div>
  );
}
