import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import type {
  PaginatedProcesos,
  Proceso,
  ProcesoCreatePayload,
  ProcesoFiltros,
  ProcesoUpdatePayload,
} from "@/types";
import type {
  EtapasResponse,
  EtapaOut,
  EtapaCreatePayload,
  BuclePayload,
  MontosProceso,
} from "@/types/etapa";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach Bearer token from authStore if present.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — on 401, clear auth state and redirect to /login.
// Guard against redirect loop: skip if already on the login page.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============================================================
// C2 — Proceso API functions (use existing `api` instance with Bearer auth)
// ============================================================

export async function getProcesos(
  filtros: ProcesoFiltros = {}
): Promise<PaginatedProcesos> {
  const res = await api.get<PaginatedProcesos>("/procesos", {
    params: filtros,
  });
  return res.data;
}

export async function getProceso(id: number): Promise<Proceso> {
  const res = await api.get<Proceso>(`/procesos/${id}`);
  return res.data;
}

export async function createProceso(
  payload: ProcesoCreatePayload
): Promise<Proceso> {
  const res = await api.post<Proceso>("/procesos", payload);
  return res.data;
}

export async function updateProceso(
  id: number,
  payload: ProcesoUpdatePayload
): Promise<Proceso> {
  const res = await api.put<Proceso>(`/procesos/${id}`, payload);
  return res.data;
}

export async function deleteProceso(id: number): Promise<void> {
  await api.delete(`/procesos/${id}`);
}

// ============================================================
// C3a — Etapas API functions
// ============================================================

export async function getEtapas(procesoId: number): Promise<EtapasResponse> {
  const res = await api.get<EtapasResponse>(`/procesos/${procesoId}/etapas`);
  return res.data;
}

export async function registrarEtapa(
  procesoId: number,
  payload: EtapaCreatePayload
): Promise<EtapaOut> {
  const res = await api.post<EtapaOut>(`/procesos/${procesoId}/etapas`, payload);
  return res.data;
}

export async function actualizarEtapa(
  etapaId: number,
  payload: Partial<EtapaCreatePayload>
): Promise<EtapaOut> {
  const res = await api.put<EtapaOut>(`/etapas/${etapaId}`, payload);
  return res.data;
}

export async function agregarRonda(
  procesoId: number,
  cod: string,
  payload: BuclePayload
): Promise<EtapaOut> {
  const res = await api.post<EtapaOut>(
    `/procesos/${procesoId}/etapas/${cod}/bucle`,
    payload
  );
  return res.data;
}

// ============================================================
// C3b — Reiniciar TDR (POST /procesos/{id}/reiniciar-tdr)
// Design D3: reopens E02 after E10 SIN_PRESUPUESTO cancellation.
// ADMIN/EDITOR only — backend enforces; FE gate via useReiniciarTdr.
// ============================================================

export async function reiniciarTdr(procesoId: number): Promise<EtapaOut> {
  const res = await api.post<EtapaOut>(`/procesos/${procesoId}/reiniciar-tdr`);
  return res.data;
}

// ============================================================
// C3b — GET /procesos/{id}/montos
// Returns montos_proceso row for the ficha display (Valor EM, OCS, etc.).
// Returns null when no trigger stages have completed yet (no row exists).
// Design §WU-F4: backend may embed montos in GET /procesos/{id} or expose
// a separate endpoint; using a dedicated endpoint here for clean separation.
// ============================================================

export async function getMontosProceso(
  procesoId: number
): Promise<MontosProceso | null> {
  const res = await api.get<MontosProceso | null>(`/procesos/${procesoId}/montos`);
  return res.data;
}
