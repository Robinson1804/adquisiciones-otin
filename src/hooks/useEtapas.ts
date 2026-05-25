/**
 * C3a — useEtapas hooks.
 * Follows the same pattern as useProcesos (React Query v5, TanStack).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getEtapas,
  registrarEtapa,
  actualizarEtapa,
  agregarRonda,
} from "@/lib/api";
import type {
  EtapasResponse,
  EtapaOut,
  EtapaCreatePayload,
  BuclePayload,
} from "@/types/etapa";

// ----------------------------------------------------------------
// Query key factory
// ----------------------------------------------------------------
export const etapaKeys = {
  all: (procesoId: number) => ["etapas", procesoId] as const,
};

// ----------------------------------------------------------------
// useEtapas — fetches grouped etapas + progreso for a proceso.
// ----------------------------------------------------------------
export function useEtapas(procesoId: number) {
  return useQuery<EtapasResponse, Error>({
    queryKey: etapaKeys.all(procesoId),
    queryFn: () => getEtapas(procesoId),
    enabled: procesoId > 0,
  });
}

// ----------------------------------------------------------------
// useRegistrarEtapa — POST /procesos/{id}/etapas
// Invalidates etapas cache on success.
// ----------------------------------------------------------------
export function useRegistrarEtapa(procesoId: number) {
  const qc = useQueryClient();
  return useMutation<EtapaOut, Error, EtapaCreatePayload>({
    mutationFn: (payload) => registrarEtapa(procesoId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: etapaKeys.all(procesoId) });
    },
  });
}

// ----------------------------------------------------------------
// useActualizarEtapa — PUT /etapas/{id}
// Invalidates etapas + proceso caches on success.
// ----------------------------------------------------------------
export function useActualizarEtapa(procesoId: number) {
  const qc = useQueryClient();
  return useMutation<
    EtapaOut,
    Error,
    { etapaId: number; payload: Partial<EtapaCreatePayload> }
  >({
    mutationFn: ({ etapaId, payload }) => actualizarEtapa(etapaId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: etapaKeys.all(procesoId) });
      void qc.invalidateQueries({ queryKey: ["proceso", procesoId] });
    },
  });
}

// ----------------------------------------------------------------
// useAgregarRonda — POST /procesos/{id}/etapas/{cod}/bucle
// Invalidates etapas cache on success.
// ----------------------------------------------------------------
export function useAgregarRonda(procesoId: number) {
  const qc = useQueryClient();
  return useMutation<
    EtapaOut,
    Error,
    { cod: string; payload: BuclePayload }
  >({
    mutationFn: ({ cod, payload }) => agregarRonda(procesoId, cod, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: etapaKeys.all(procesoId) });
    },
  });
}
