/**
 * C3a — LineaTiempo tests.
 * WU-12: renders etapa cards, bucle shows ronda badge, COLORES_ACTOR applied.
 * Updated: 28 etapas (added E06b).
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LineaTiempo } from "@/components/procesos/LineaTiempo";
import type { EtapasResponse } from "@/types/etapa";
import { COLORES_ACTOR } from "@/lib/constants";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 2, username: "viewer", nombre_completo: "Viewer", rol: "VIEWER", area: null },
    token: "t",
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock("@/hooks/useEtapas", () => ({
  useEtapas: vi.fn(),
  useAgregarRonda: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useReiniciarTdr: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useRegistrarEtapa: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useActualizarEtapa: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

// Mock ModalRegistroEtapa to avoid deep render
vi.mock("@/components/procesos/ModalRegistroEtapa", () => ({
  ModalRegistroEtapa: () => React.createElement("div", { "data-testid": "modal-mock" }),
}));

// Mock AdjuntosEtapa — EtapaCard now renders it inside the expandable panel
vi.mock("@/components/procesos/AdjuntosEtapa", () => ({
  AdjuntosEtapa: ({ etapaId }: { etapaId: number }) =>
    React.createElement('div', { 'data-testid': `adjuntos-mock-${etapaId}` }, 'Adjuntos mock'),
}));

import { useEtapas } from "@/hooks/useEtapas";

// flujo-real-otin-v2: 32 etapas — E01 removed, E01a/E01b/E01c/E02b/E06c added
const ETAPA_CODES = [
  'E01a','E01b','E01c','E02','E02b',
  'E03','E04','E05','E06','E06b','E06c','E07','E08','E08a','E08b',
  'E09','E10','E11','E12','E13','E14','E15','E16','E17','E18',
  'E19','E20','E21','E22','E23','E24','E25',
];

function makeEtapa(cod: string, area = 'OTIN', overrides = {}) {
  return {
    cod,
    nombre: `Etapa ${cod}`,
    area_responsable: area,
    es_bucle: ['E05','E06','E06b','E06c','E08a','E08b'].includes(cod),
    por_area: ['E01c','E11','E24'].includes(cod),
    estado: 'PENDIENTE',
    filas: [],
    rondas: [],
    alerta_otpp: null,
    monto_total: null,
    ...overrides,
  };
}

const allPendingResponse: EtapasResponse = {
  etapas: ETAPA_CODES.map((cod) => makeEtapa(cod)),
  progreso: {
    etapa_actual: 'E01a',
    porcentaje: 0,
    completadas: 0,
    total: 26,
  },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("LineaTiempo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Cambio 1: bucle stages with no rondas are hidden → 26 non-bucle + 0 bucle = 26 visible
  // (32 total - 6 bucles sin rondas: E05, E06, E06b, E06c, E08a, E08b)
  it("renders 26 visible etapa cards when all bucles have no rondas (flujo-real-otin-v2)", () => {
    vi.mocked(useEtapas).mockReturnValue({
      data: allPendingResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(26);
  });

  it("renders all non-bucle etapa codes as article labels (flujo-real-otin-v2)", () => {
    vi.mocked(useEtapas).mockReturnValue({
      data: allPendingResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    const BUCLE_CODES = ['E05','E06','E06b','E06c','E08a','E08b'];
    const nonBucleCodes = ETAPA_CODES.filter((cod) => !BUCLE_CODES.includes(cod));
    for (const cod of nonBucleCodes) {
      expect(screen.getByTestId(`etapa-card-${cod}`)).toBeInTheDocument();
    }
    // Bucle codes with no rondas should be absent
    for (const cod of BUCLE_CODES) {
      expect(screen.queryByTestId(`etapa-card-${cod}`)).not.toBeInTheDocument();
    }
  });

  it("bucle stage E05 with 2 rondas renders Ronda badge", () => {
    const responseWithRondas: EtapasResponse = {
      ...allPendingResponse,
      etapas: allPendingResponse.etapas.map((e) =>
        e.cod === 'E05'
          ? {
              ...e,
              estado: 'COMPLETADO',
              rondas: [
                { id: 1, nro_ronda: 1, motivo_bucle: 'Primera obs.', estado_etapa: 'COMPLETADO', fecha_inicio: '2026-04-01', fecha_fin: '2026-04-10', dias: 9 },
                { id: 2, nro_ronda: 2, motivo_bucle: 'Segunda obs.', estado_etapa: 'EN_CURSO', fecha_inicio: '2026-04-11', fecha_fin: null, dias: null },
              ],
            }
          : e
      ),
    };

    vi.mocked(useEtapas).mockReturnValue({
      data: responseWithRondas,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    // Should show "Ronda 2" badge (latest ronda)
    expect(screen.getByText('Ronda 2')).toBeInTheDocument();
  });

  it("AREAS actor chip is rendered inside the E01a card (actor color in chip, not card bg)", () => {
    const responseWithAreas: EtapasResponse = {
      ...allPendingResponse,
      etapas: allPendingResponse.etapas.map((e) =>
        e.cod === 'E01a' ? { ...e, area_responsable: 'AREAS' } : e
      ),
    };

    vi.mocked(useEtapas).mockReturnValue({
      data: responseWithAreas,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    // Card no longer has actor bg as inline style — actor color lives in the chip only
    const e01aCard = screen.getByTestId('etapa-card-E01a');
    expect(e01aCard).not.toHaveStyle({ backgroundColor: COLORES_ACTOR.AREAS.bg });

    // Actor chip inside E01a card shows "AREAS" label
    const chip = e01aCard.querySelector('[data-testid="actor-chip"]');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('AREAS');
  });

  // ---------------------------------------------------------------
  // Cambio 1 — Bucles ocultos por default
  // ---------------------------------------------------------------

  it("Cambio-1: bucle stage with no rondas is NOT rendered in the timeline", () => {
    // All bucle stages have rondas: [], so they should be hidden
    vi.mocked(useEtapas).mockReturnValue({
      data: allPendingResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    // E05, E06, E06b, E06c, E08a, E08b all have rondas:[] → should NOT appear
    expect(screen.queryByTestId('etapa-card-E05')).not.toBeInTheDocument();
    expect(screen.queryByTestId('etapa-card-E06')).not.toBeInTheDocument();
    expect(screen.queryByTestId('etapa-card-E06b')).not.toBeInTheDocument();
    expect(screen.queryByTestId('etapa-card-E06c')).not.toBeInTheDocument();
    expect(screen.queryByTestId('etapa-card-E08a')).not.toBeInTheDocument();
    expect(screen.queryByTestId('etapa-card-E08b')).not.toBeInTheDocument();
  });

  it("Cambio-1: bucle stage WITH rondas IS rendered in the timeline", () => {
    const responseWithE05Ronda: EtapasResponse = {
      ...allPendingResponse,
      etapas: allPendingResponse.etapas.map((e) =>
        e.cod === 'E05'
          ? { ...e, rondas: [{ id: 1, nro_ronda: 1, motivo_bucle: 'obs', estado_etapa: 'EN_CURSO', fecha_inicio: null, fecha_fin: null, dias: null }] }
          : e
      ),
    };

    vi.mocked(useEtapas).mockReturnValue({
      data: responseWithE05Ronda,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    expect(screen.getByTestId('etapa-card-E05')).toBeInTheDocument();
    // E06 still has no rondas → still hidden
    expect(screen.queryByTestId('etapa-card-E06')).not.toBeInTheDocument();
  });

  it("Cambio-1: non-bucle stages always render regardless of filas", () => {
    vi.mocked(useEtapas).mockReturnValue({
      data: allPendingResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    // Non-bucle stages should always be present
    expect(screen.getByTestId('etapa-card-E01a')).toBeInTheDocument();
    expect(screen.getByTestId('etapa-card-E04')).toBeInTheDocument();
    expect(screen.getByTestId('etapa-card-E08')).toBeInTheDocument();
    expect(screen.getByTestId('etapa-card-E25')).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading", () => {
    vi.mocked(useEtapas).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it("shows error message when isError", () => {
    vi.mocked(useEtapas).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network Error"),
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
  });
});
