import type { COLORES_ACTOR, COLORES_ESTADO } from "@/lib/constants";

export interface HealthResponse {
  status: string;
  database: string;
}

export type ActorKey = keyof typeof COLORES_ACTOR;
export type EstadoKey = keyof typeof COLORES_ESTADO;
