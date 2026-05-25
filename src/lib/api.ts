import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import type {
  PaginatedProcesos,
  Proceso,
  ProcesoCreatePayload,
  ProcesoFiltros,
  ProcesoUpdatePayload,
} from "@/types";

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
