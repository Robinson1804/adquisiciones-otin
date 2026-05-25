import type { COLORES_ACTOR, COLORES_ESTADO } from "@/lib/constants";

export interface HealthResponse {
  status: string;
  database: string;
}

export type ActorKey = keyof typeof COLORES_ACTOR;
export type EstadoKey = keyof typeof COLORES_ESTADO;

// Mirror of backend schemas/auth.py UserOut — keep in sync with API contract.
export interface UserOut {
  id: number;
  username: string;
  nombre_completo: string;
  rol: "ADMIN" | "EDITOR" | "VIEWER";
  area: string | null;
}

// ============================================================
// C2 — Proceso types (mirror backend/app/schemas/proceso.py)
// ============================================================

export type EstadoProceso = "EN PROCESO" | "CULMINADO" | "CANCELADO";
export type TipoProceso = "BIEN" | "SERVICIO";

export interface Proceso {
  id: number;
  id_proceso: string;
  requerimiento: string;
  tipo: TipoProceso | null;
  unidad_resp: string | null;
  areas_usuarias: string[] | null;
  /** Decimal serialized as string by backend — use parseFloat() for display/math. */
  pim: string | null;
  estado: EstadoProceso;
  motivo_cancel: string | null;
  fecha_creacion: string;
  creado_por: string | null;
  anno: number | null;
}

export interface PaginatedProcesos {
  items: Proceso[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ProcesoCreatePayload {
  requerimiento: string;
  tipo: TipoProceso;
  unidad_resp?: string | null;
  areas_usuarias: string[];
  pim?: number | null;
  anno: number;
  cmn_por_area: { area: string; cmn_adjunto: "SI" | "NO" }[];
}

export interface ProcesoUpdatePayload {
  requerimiento?: string | null;
  tipo?: TipoProceso | null;
  unidad_resp?: string | null;
  areas_usuarias?: string[] | null;
  pim?: number | null;
  estado?: EstadoProceso | null;
  motivo_cancel?: string | null;
}

export interface ProcesoFiltros {
  page?: number;
  page_size?: number;
  anno?: number;
  estado?: EstadoProceso;
  tipo?: TipoProceso;
  search?: string;
  area?: string;
}
