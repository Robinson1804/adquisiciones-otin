// ============================================================
// C3a — Etapa types (mirror backend/app/schemas/etapa.py)
// Grouped GET contract: Design D4
// ============================================================

export interface FilaArea {
  id: number;
  area_usuaria: string;
  estado_etapa: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias: number | null;
  // Stage-specific optional fields
  cmn_adjunto?: string;
  monto_cert?: number;
  resultado_eval?: string;
  nro_ocs?: string;
  monto_ocs?: number;
  plazo_entrega?: number;
  fecha_envio_otpp?: string;
  fecha_resp_otpp?: string;
  vencimiento_ocs?: string | null;
}

export interface RondaBucle {
  id: number;
  nro_ronda: number;
  motivo_bucle: string;
  estado_etapa: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias: number | null;
}

export type EstadoEtapa = 'COMPLETADO' | 'EN_CURSO' | 'PENDIENTE' | 'OMITIDO';

export interface EtapaAgrupada {
  cod: string;
  nombre: string;
  area_responsable: string;
  es_bucle: boolean;
  por_area: boolean;
  estado: EstadoEtapa;
  filas: FilaArea[];
  rondas: RondaBucle[];
  alerta_otpp: boolean | null;
  monto_total: number | null;
}

export interface Progreso {
  etapa_actual: string | null;
  porcentaje: number;
  completadas: number;
  total: number;
}

export interface EtapasResponse {
  etapas: EtapaAgrupada[];
  progreso: Progreso;
}

export interface EtapaOut {
  id: number;
  codigo_etapa: string;
  nro_ronda: number | null;
  area_usuaria: string | null;
  estado_etapa: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias: number | null;
  vencimiento_ocs?: string | null;
}

export interface EtapaCreatePayload {
  codigo_etapa: string;
  nombre_etapa: string;
  fecha_inicio: string;
  estado_etapa: string;
  fecha_fin?: string;
  responsable?: string;
  oficio_correo?: string;
  observaciones?: string;
  // Per-stage optional fields
  area_usuaria?: string;
  cmn_adjunto?: string;
  monto_cert?: number;
  resultado_eval?: string;
  motivo_bucle?: string;
  fecha_envio_otpp?: string;
  fecha_resp_otpp?: string;
  nro_ocs?: string;
  monto_ocs?: number;
  plazo_entrega?: number;
}

export interface BuclePayload {
  motivo_bucle: string;
}

// ============================================================
// C3b — MontosProceso (mirrors backend montos_proceso table)
// Populated as trigger stages complete: E09→valor_em, E12→monto_cert_total,
// E19→nro_ocs/monto_ocs/plazo_entrega, E22→fecha_inicio_srv.
// Returned by GET /procesos/{id} or GET /procesos/{id}/montos (Design §WU-F4).
// ============================================================
export interface MontosProceso {
  valor_em: number | null;
  monto_cert_total: number | null;
  nro_ocs: string | null;
  monto_ocs: number | null;
  plazo_entrega: number | null;
  fecha_inicio_srv: string | null;
}

// ============================================================
// C3b — EtapaCreatePayload extended with motivo_cancel (R2/E10)
// ============================================================
export interface EtapaCreatePayloadC3b extends EtapaCreatePayload {
  motivo_cancel?: string;
}
