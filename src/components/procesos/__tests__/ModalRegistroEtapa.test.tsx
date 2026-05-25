/**
 * C3a — ModalRegistroEtapa tests.
 * WU-12: contextual fields per stage code.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalRegistroEtapa } from "@/components/procesos/ModalRegistroEtapa";
import type { EtapaAgrupada } from "@/types/etapa";

vi.mock("@/hooks/useEtapas", () => ({
  useRegistrarEtapa: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useActualizarEtapa: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// TablaAreasE11/E24 are mocked to avoid double-testing per-area logic here
vi.mock("@/components/procesos/TablaAreasE11", () => ({
  TablaAreasE11: () =>
    React.createElement("div", { "data-testid": "tabla-areas-e11-mock" }, "TablaAreasE11"),
}));

vi.mock("@/components/procesos/TablaAreasE24", () => ({
  TablaAreasE24: () =>
    React.createElement("div", { "data-testid": "tabla-areas-e24-mock" }, "TablaAreasE24"),
}));

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

describe("ModalRegistroEtapa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("E01 modal shows cmn_adjunto select field", () => {
    const etapa = makeEtapa('E01');
    render(
      React.createElement(ModalRegistroEtapa, {
        procesoId: 1,
        etapa,
        open: true,
        onClose: vi.fn(),
        areasUsuarias: ['DTDIS'],
      }),
      { wrapper: Wrapper }
    );

    // cmn_adjunto select should be present
    expect(screen.getByLabelText(/CMN Adjunto/i)).toBeInTheDocument();
    // monto fields should NOT be present for E01
    expect(screen.queryByLabelText(/Monto Cert/i)).not.toBeInTheDocument();
  });

  it("E11 modal delegates to TablaAreasE11 (no generic form)", () => {
    const etapa = makeEtapa('E11', { por_area: true });
    render(
      React.createElement(ModalRegistroEtapa, {
        procesoId: 1,
        etapa,
        open: true,
        onClose: vi.fn(),
        areasUsuarias: ['DTDIS'],
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByTestId("tabla-areas-e11-mock")).toBeInTheDocument();
    // Should NOT render the standard form fields
    expect(screen.queryByLabelText(/Fecha Inicio/i)).not.toBeInTheDocument();
  });

  it("E24 modal delegates to TablaAreasE24", () => {
    const etapa = makeEtapa('E24', { por_area: true });
    render(
      React.createElement(ModalRegistroEtapa, {
        procesoId: 1,
        etapa,
        open: true,
        onClose: vi.fn(),
        areasUsuarias: ['DTDIS'],
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByTestId("tabla-areas-e24-mock")).toBeInTheDocument();
  });

  it("E05 modal shows motivo_bucle textarea (bucle stage)", () => {
    const etapa = makeEtapa('E05', { es_bucle: true });
    render(
      React.createElement(ModalRegistroEtapa, {
        procesoId: 1,
        etapa,
        open: true,
        onClose: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    // motivo_bucle textarea
    expect(screen.getByLabelText(/Motivo de la Ronda/i)).toBeInTheDocument();
    // nro_ronda should be display-only (not a form field)
    expect(screen.getByText(/Ronda 1 — asignado por el sistema/i)).toBeInTheDocument();
    // No monto or CMN fields
    expect(screen.queryByLabelText(/Monto Cert/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/CMN/i)).not.toBeInTheDocument();
  });

  it("E02 modal shows only common fields (no campos_extra)", () => {
    const etapa = makeEtapa('E02');
    render(
      React.createElement(ModalRegistroEtapa, {
        procesoId: 1,
        etapa,
        open: true,
        onClose: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    // Common fields present
    expect(screen.getByLabelText(/Fecha Inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument();
    // No campos_extra for E02
    expect(screen.queryByLabelText(/CMN/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Monto Cert/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Motivo/i)).not.toBeInTheDocument();
  });

  it("E19 modal shows nro_ocs, monto_ocs and plazo_entrega fields", () => {
    const etapa = makeEtapa('E19');
    render(
      React.createElement(ModalRegistroEtapa, {
        procesoId: 1,
        etapa,
        open: true,
        onClose: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByLabelText(/N. OCS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monto OCS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plazo Entrega/i)).toBeInTheDocument();
  });

  it("E16 modal shows fecha_envio_otpp field", () => {
    const etapa = makeEtapa('E16');
    render(
      React.createElement(ModalRegistroEtapa, {
        procesoId: 1,
        etapa,
        open: true,
        onClose: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByLabelText(/Fecha Envio OTPP/i)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const etapa = makeEtapa('E02');
    const { container } = render(
      React.createElement(ModalRegistroEtapa, {
        procesoId: 1,
        etapa,
        open: false,
        onClose: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    expect(container.firstChild).toBeNull();
  });
});
