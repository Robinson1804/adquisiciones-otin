/**
 * C3a — LineaTiempo tests.
 * WU-12: renders 27 etapa cards, bucle shows ronda badge, COLORES_ACTOR applied.
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
}));

// Mock ModalRegistroEtapa to avoid deep render
vi.mock("@/components/procesos/ModalRegistroEtapa", () => ({
  ModalRegistroEtapa: () => React.createElement("div", { "data-testid": "modal-mock" }),
}));

import { useEtapas } from "@/hooks/useEtapas";

const ETAPA_CODES = [
  'E01','E02','E03','E04','E05','E06','E07','E08','E08a','E08b',
  'E09','E10','E11','E12','E13','E14','E15','E16','E17','E18',
  'E19','E20','E21','E22','E23','E24','E25',
];

function makeEtapa(cod: string, area = 'OTIN', overrides = {}) {
  return {
    cod,
    nombre: `Etapa ${cod}`,
    area_responsable: area,
    es_bucle: ['E05','E06','E08a','E08b'].includes(cod),
    por_area: ['E01','E11','E24'].includes(cod),
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
    etapa_actual: 'E01',
    porcentaje: 0,
    completadas: 0,
    total: 25,
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

  it("renders 27 etapa cards in order", () => {
    vi.mocked(useEtapas).mockReturnValue({
      data: allPendingResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(27);
  });

  it("renders all 27 etapa codes as article labels", () => {
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

  it("applies COLORES_ACTOR bg for AREAS etapas (E01)", () => {
    const responseWithAreas: EtapasResponse = {
      ...allPendingResponse,
      etapas: allPendingResponse.etapas.map((e) =>
        e.cod === 'E01' ? { ...e, area_responsable: 'AREAS' } : e
      ),
    };

    vi.mocked(useEtapas).mockReturnValue({
      data: responseWithAreas,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useEtapas>);

    render(React.createElement(LineaTiempo, { procesoId: 1 }), { wrapper: Wrapper });

    const e01Card = screen.getByTestId('etapa-card-E01');
    expect(e01Card).toHaveStyle({ backgroundColor: COLORES_ACTOR.AREAS.bg });
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
