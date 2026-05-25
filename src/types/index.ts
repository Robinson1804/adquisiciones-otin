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
