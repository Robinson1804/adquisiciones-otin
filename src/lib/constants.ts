// ============================================================
// COLORES POR ACTOR — fuente canónica: CONTEXT.md §7
// ============================================================
export const COLORES_ACTOR = {
  AREAS:       { bg: '#E8F5E9', text: '#27500A', border: '#81C784' },
  OTIN:        { bg: '#FFF2CC', text: '#7F4A09', border: '#FFD54F' },
  OTA:         { bg: '#E8F3E8', text: '#2E7D32', border: '#A5D6A7' },
  OEAS:        { bg: '#F3E5F5', text: '#7B1FA2', border: '#CE93D8' },
  BUCLE:       { bg: '#FFE699', text: '#7F6000', border: '#F9A825', dashed: true as const },
  SEC_GENERAL: { bg: '#FCE4EC', text: '#AD1457', border: '#F48FB1' },
  OTPP:        { bg: '#FBE9E7', text: '#BF360C', border: '#FFAB91' },
  PROVEEDOR:   { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9' },
} as const;

// ============================================================
// COLORES POR ESTADO — fuente canónica: CONTEXT.md §7
// ============================================================
export const COLORES_ESTADO = {
  COMPLETADO: { bg: '#C6EFCE', text: '#276221' },
  EN_CURSO:   { bg: '#DDEBF7', text: '#1F3864' },
  PENDIENTE:  { bg: '#FFEB9C', text: '#9C5700' },
  CANCELADO:  { bg: '#FFCDD2', text: '#B71C1C' },
  OMITIDO:    { bg: '#E0E0E0', text: '#616161' },
} as const;

// ============================================================
// CATÁLOGO COMPLETO DE ETAPAS — fuente canónica: CONTEXT.md §8
// 27 entradas: E01–E25 incluyendo E08a y E08b
// ============================================================
export const ETAPAS_CONFIG = [
  { cod: 'E01',  area: 'AREAS',       nombre: 'Solicitud de requerimiento TIC (Áreas → OTIN)',
    instruccion: 'Una fila por área. Validar CMN de TODAS antes de avanzar.',
    campos_extra: ['cmn_adjunto'] },

  { cod: 'E02',  area: 'OTIN',        nombre: 'Elaboración TDR consolidado (OTIN)',
    instruccion: 'OTIN consolida todos los requerimientos en un solo TDR.' },

  { cod: 'E03',  area: 'OTIN',        nombre: 'Envío indagación de mercado (OTIN → OTA)',
    instruccion: 'OTIN envía TDR a OTA. Registrar N° oficio.' },

  { cod: 'E04',  area: 'OTA',         nombre: 'OTA deriva expediente a OEAS (OTA → OEAS)',
    instruccion: 'OTA recibe y deriva a OEAS para indagación.' },

  { cod: 'E05',  area: 'BUCLE',       nombre: 'Observaciones al TDR [BUCLE] (OEAS → OTIN)',
    instruccion: 'OEAS devuelve con observaciones. Registrar motivo + N° ronda.',
    es_bucle: true as const, campos_extra: ['motivo_bucle', 'nro_ronda'] },

  { cod: 'E06',  area: 'BUCLE',       nombre: 'Corrección TDR [BUCLE] (OTIN → OEAS)',
    instruccion: 'OTIN corrige y reenvía. Registrar corrección + N° ronda.',
    es_bucle: true as const, campos_extra: ['motivo_bucle', 'nro_ronda'] },

  { cod: 'E07',  area: 'OEAS',        nombre: 'Evaluación técnica (OEAS → OTIN)',
    instruccion: 'OEAS verifica que proveedores cumplen TDR.',
    campos_extra: ['resultado_eval'] },

  { cod: 'E08',  area: 'OTIN',        nombre: 'Respuesta OTIN a evaluación técnica (OTIN → OEAS)',
    instruccion: 'APROBADO → avanza E09. CON OBSERVACIONES → bucle E08a/E08b.',
    campos_extra: ['resultado_eval'] },

  { cod: 'E08a', area: 'BUCLE',       nombre: 'Observaciones al proveedor [BUCLE] (OEAS → Prov.)',
    instruccion: 'OEAS comunica observaciones al proveedor.',
    es_bucle: true as const, campos_extra: ['motivo_bucle', 'nro_ronda'] },

  { cod: 'E08b', area: 'BUCLE',       nombre: 'Subsanación + re-evaluación [BUCLE] (Prov→OEAS→OTIN)',
    instruccion: 'Proveedor subsana → OEAS re-evalúa → OTIN responde.',
    es_bucle: true as const, campos_extra: ['motivo_bucle', 'nro_ronda'] },

  { cod: 'E09',  area: 'OEAS',        nombre: 'Cuadro comparativo (OEAS → OTIN)',
    instruccion: 'Solo cuando eval. técnica APROBADA. Registrar valor EM.',
    campos_extra: ['monto_cert'] },

  { cod: 'E10',  area: 'OTIN',        nombre: 'OTIN solicita anexo cert. + valida presupuesto (OTIN → Áreas)',
    instruccion: 'Validar que cada área tenga presupuesto. Sin monto = PROCESO CANCELA.',
    campos_extra: ['resultado_eval'] },

  { cod: 'E11',  area: 'AREAS',       nombre: 'Solicitud cert. presupuestal (cada Área → OTIN)',
    instruccion: 'Una fila por área. Registrar área + monto cert. S/.',
    por_area: true as const, campos_extra: ['area_usuaria', 'monto_cert'] },

  { cod: 'E12',  area: 'OTIN',        nombre: 'Consolidación cert. presupuestales (OTIN)',
    instruccion: 'Registrar monto total consolidado.' },

  { cod: 'E13',  area: 'OTIN',        nombre: 'Envío consolidado a Secretaría General (OTIN → SG)',
    instruccion: 'Registrar N° oficio.' },

  { cod: 'E14',  area: 'SEC_GENERAL', nombre: 'Aprobación Secretaría General (SG)',
    instruccion: 'Registrar N° oficio de aprobación.' },

  { cod: 'E15',  area: 'SEC_GENERAL', nombre: 'Envío a OTPP (Sec. General → OTPP)',
    instruccion: 'SG remite expediente a OTPP.' },

  { cod: 'E16',  area: 'OTPP',        nombre: 'Certificación presupuestal — OTPP',
    instruccion: 'Registrar fecha envío Y fecha respuesta. Alerta si >20 días.',
    campos_extra: ['fecha_envio_otpp', 'fecha_resp_otpp'],
    alerta_dias: 20 as const },

  { cod: 'E17',  area: 'OTPP',        nombre: 'OTPP envía a OTA (OTPP → OTA)',
    instruccion: 'OTPP remite expediente certificado a OTA.' },

  { cod: 'E18',  area: 'OTA',         nombre: 'OTA deriva a OEAS (OTA → OEAS)',
    instruccion: 'OTA recibe y deriva a OEAS para emisión de orden.' },

  { cod: 'E19',  area: 'OEAS',        nombre: 'Emisión orden de compra/servicio (OEAS)',
    instruccion: 'Registrar N° OCS + monto + plazo. Calcular fecha vencimiento.',
    campos_extra: ['nro_ocs', 'monto_ocs', 'plazo_entrega'] },

  { cod: 'E20',  area: 'OEAS',        nombre: 'Notificación al proveedor (OEAS → Proveedor)',
    instruccion: 'Registrar fecha de notificación.' },

  { cod: 'E21',  area: 'PROVEEDOR',   nombre: 'Confirmación recepción OCS (Proveedor→OEAS→OTIN)',
    instruccion: 'Desde aquí corre el servicio/bien.' },

  { cod: 'E22',  area: 'PROVEEDOR',   nombre: 'Inicio de servicio / entrega del bien',
    instruccion: 'Registrar FECHA REAL DE INICIO.' },

  { cod: 'E23',  area: 'OTIN',        nombre: 'OTIN solicita conformidad (OTIN → Áreas)',
    instruccion: 'Notificar a cada área que emita conformidad.' },

  { cod: 'E24',  area: 'AREAS',       nombre: 'Conformidad área usuaria [por área] (Áreas → OTIN)',
    instruccion: 'Una fila por área. Registrar fecha + días demora.',
    por_area: true as const, campos_extra: ['area_usuaria'] },

  { cod: 'E25',  area: 'OTIN',        nombre: 'Conformidad final consolidada (OTIN) FIN',
    instruccion: 'FIN DEL PROCESO. Fecha = FECHA_FIN_TOTAL.',
    es_fin: true as const },
] as const;
