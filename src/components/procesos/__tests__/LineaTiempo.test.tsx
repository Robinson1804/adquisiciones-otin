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

  it("renders 32 etapa cards in order (flujo-real-otin-v2)", () => {
    vi.mocked(useEtapas).mockReturnValue({
      data: allPendingResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(32);
  });

  it("renders all 32 etapa codes as article labels (flujo-real-otin-v2)", () => {
    vi.mocked(useEtapas).mockReturnValue({
      data: allPendingResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    for (const cod of ETAPA_CODES) {
      expect(screen.getByTestId(`etapa-card-${cod}`)).toBeInTheDocument();
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
