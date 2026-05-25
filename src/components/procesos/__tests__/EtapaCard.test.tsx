/**
 * C3a — EtapaCard tests.
 * WU-12: VIEWER role, prerequisite disabled button, alerta_otpp badge.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EtapaCard } from "@/components/procesos/EtapaCard";
import type { EtapaAgrupada } from "@/types/etapa";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/hooks/useEtapas", () => ({
  useAgregarRonda: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useReiniciarTdr: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

import { useAuthStore } from "@/stores/authStore";
import type { FilaArea } from "@/types/etapa";

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

function makeEtapa(cod: string, overrides: Partial<EtapaAgrupada> = {}): EtapaAgrupada {
  return {
    cod,
    nombre: `Etapa ${cod}`,
    area_responsable: 'OTIN',
    es_bucle: false,
    por_area: false,
    estado: 'PENDIENTE',
    filas: [],
    rondas: [],
    alerta_otpp: null,
    monto_total: null,
    ...overrides,
  };
}

describe("EtapaCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("VIEWER user does not see Registrar button", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 2, username: "viewer", nombre_completo: "Viewer", rol: "VIEWER", area: null },
      token: "t",
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E02');
    render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        actionability: { canRegister: true, blockedReason: null },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.queryByRole('button', { name: /Registrar/i })).not.toBeInTheDocument();
  });

  it("EDITOR user sees Registrar button when actionable", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 1, username: "editor", nombre_completo: "Editor", rol: "EDITOR", area: null },
      token: "t",
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E03');
    render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        actionability: { canRegister: true, blockedReason: null },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('button', { name: /Registrar avance de E03/i })).toBeInTheDocument();
  });

  it("prerequisite not met shows disabled Bloqueado button", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 1, username: "editor", nombre_completo: "Editor", rol: "EDITOR", area: null },
      token: "t",
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E02');
    const blockedReason = "E01 debe estar COMPLETADO antes de registrar E02";

    render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        actionability: { canRegister: false, blockedReason },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    const btn = screen.getByRole('button', { name: /E02 bloqueado/i });
    expect(btn).toBeDisabled();
  });

  it("E16 card shows red alert badge when alerta_otpp is true", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 2, username: "viewer", nombre_completo: "Viewer", rol: "VIEWER", area: null },
      token: "t",
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E16', {
      area_responsable: 'OTPP',
      alerta_otpp: true,
    });

    render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        actionability: { canRegister: true, blockedReason: null },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/20 dias sin respuesta OTPP/i)).toBeInTheDocument();
  });

  it("E21 COMPLETADO shows plazo indicator", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 2, username: "viewer", nombre_completo: "Viewer", rol: "VIEWER", area: null },
      token: "t",
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E21', {
      area_responsable: 'PROVEEDOR',
      estado: 'COMPLETADO',
    });

    render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        actionability: { canRegister: true, blockedReason: null },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByText(/Inicio del plazo del servicio\/bien/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // C3b WU-F3: Reiniciar-TDR button
  // ---------------------------------------------------------------

  it("E10 card with CANCELADO + SIN_PRESUPUESTO shows Reiniciar TDR button (EDITOR)", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 1, username: "editor", nombre_completo: "Editor", rol: "EDITOR", area: null },
      token: "t",
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E10', {
      filas: [{
        id: 1, area_usuaria: 'OTIN', estado_etapa: 'COMPLETADO',
        fecha_inicio: null, fecha_fin: null, dias: null,
        resultado_eval: 'SIN_PRESUPUESTO',
      } as FilaArea],
    });

    render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        procesoEstado: 'CANCELADO',
        actionability: { canRegister: false, blockedReason: null },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('button', { name: /Reiniciar TDR/i })).toBeInTheDocument();
  });

  it("E10 card in EN PROCESO does NOT show Reiniciar TDR button", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 1, username: "editor", nombre_completo: "Editor", rol: "EDITOR", area: null },
      token: "t",
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E10', {
      filas: [{
        id: 1, area_usuaria: 'OTIN', estado_etapa: 'COMPLETADO',
        fecha_inicio: null, fecha_fin: null, dias: null,
        resultado_eval: 'VALIDADO',
      } as FilaArea],
    });

    render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        procesoEstado: 'EN PROCESO',
        actionability: { canRegister: true, blockedReason: null },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.queryByRole('button', { name: /Reiniciar TDR/i })).not.toBeInTheDocument();
  });

  it("VIEWER does not see Reiniciar TDR button even when proceso CANCELADO", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 2, username: "viewer", nombre_completo: "Viewer", rol: "VIEWER", area: null },
      token: "t",
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E10', {
      filas: [{
        id: 1, area_usuaria: 'OTIN', estado_etapa: 'COMPLETADO',
        fecha_inicio: null, fecha_fin: null, dias: null,
        resultado_eval: 'SIN_PRESUPUESTO',
      } as FilaArea],
    });

    render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        procesoEstado: 'CANCELADO',
        actionability: { canRegister: false, blockedReason: null },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.queryByRole('button', { name: /Reiniciar TDR/i })).not.toBeInTheDocument();
  });

  it("COLORES_ACTOR applied — card has correct area color", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    const etapa = makeEtapa('E01', { area_responsable: 'AREAS' });
    const { container } = render(
      React.createElement(EtapaCard, {
        etapa,
        allEtapas: [etapa],
        procesoId: 1,
        actionability: { canRegister: true, blockedReason: null },
        onRegistrar: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    // AREAS color bg is #E8F5E9
    const article = container.querySelector('article');
    expect(article).toHaveStyle({ backgroundColor: '#E8F5E9' });
  });
});
