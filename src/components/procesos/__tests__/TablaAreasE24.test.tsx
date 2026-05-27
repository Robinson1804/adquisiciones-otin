/**
 * TablaAreasE24 tests.
 * Covers: CMN column for E01 (show/edit/save) and absence of CMN for E24.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TablaAreasE24 } from "@/components/procesos/TablaAreasE24";
import type { FilaArea } from "@/types/etapa";

const mockRegistrar = vi.fn();
const mockActualizar = vi.fn();

vi.mock("@/hooks/useEtapas", () => ({
  useRegistrarEtapa: vi.fn(() => ({
    mutate: mockRegistrar,
    isPending: false,
  })),
  useActualizarEtapa: vi.fn(() => ({
    mutate: mockActualizar,
    isPending: false,
  })),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, username: "admin", nombre_completo: "Admin", rol: "ADMIN", area: null },
    token: "t",
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock("@/components/procesos/AdjuntosEtapa", () => ({
  AdjuntosEtapa: () => React.createElement("div", { "data-testid": "adjuntos-mock" }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

const areasUsuarias = ["DTDIS", "GOBERNANZA"];

const filasE01: FilaArea[] = [
  {
    id: 10,
    area_usuaria: "DTDIS",
    estado_etapa: "COMPLETADO",
    fecha_inicio: "2026-05-01",
    fecha_fin: null,
    dias: null,
    cmn_adjunto: "NO",
  },
];

describe("TablaAreasE24 — codigoEtapa='E01'", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders CMN column header", () => {
    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: filasE01,
        areasUsuarias,
        codigoEtapa: "E01",
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByRole("columnheader", { name: "CMN" })).toBeInTheDocument();
  });

  it("shows cmn_adjunto value in read mode", () => {
    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: filasE01,
        areasUsuarias: ["DTDIS"],
        codigoEtapa: "E01",
      }),
      { wrapper: Wrapper }
    );

    // Row exists with cmn_adjunto="NO", not in edit mode → shows the value
    const cmnCell = screen.getByText("NO");
    expect(cmnCell).toBeInTheDocument();
  });

  it("shows '—' for area without existing fila", () => {
    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: [],
        areasUsuarias: ["GOBERNANZA"],
        codigoEtapa: "E01",
      }),
      { wrapper: Wrapper }
    );

    // No fila → cmn_adjunto is undefined → display '—'
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("shows CMN select when row is in edit mode", () => {
    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: filasE01,
        areasUsuarias: ["DTDIS"],
        codigoEtapa: "E01",
      }),
      { wrapper: Wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Editar conformidad DTDIS/i }));

    const cmnSelect = screen.getByRole("combobox", { name: /CMN para DTDIS/i });
    expect(cmnSelect).toBeInTheDocument();
  });

  it("includes cmn_adjunto in actualizar payload when saving existing row", () => {
    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: filasE01,
        areasUsuarias: ["DTDIS"],
        codigoEtapa: "E01",
        nombreEtapa: "Solicitud de requerimiento TIC",
      }),
      { wrapper: Wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Editar conformidad DTDIS/i }));

    const cmnSelect = screen.getByRole("combobox", { name: /CMN para DTDIS/i });
    fireEvent.change(cmnSelect, { target: { value: "SI" } });

    fireEvent.click(screen.getByRole("button", { name: /Guardar/i }));

    expect(mockActualizar).toHaveBeenCalledOnce();
    const [callArgs] = mockActualizar.mock.calls;
    expect(callArgs[0].payload.cmn_adjunto).toBe("SI");
  });

  it("includes cmn_adjunto in registrar payload when saving new row", () => {
    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: [],
        areasUsuarias: ["GOBERNANZA"],
        codigoEtapa: "E01",
        nombreEtapa: "Solicitud de requerimiento TIC",
      }),
      { wrapper: Wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Editar conformidad GOBERNANZA/i }));

    const dateInput = screen.getByLabelText(/Fecha conformidad para GOBERNANZA/i);
    fireEvent.change(dateInput, { target: { value: "2026-05-10" } });

    const cmnSelect = screen.getByRole("combobox", { name: /CMN para GOBERNANZA/i });
    fireEvent.change(cmnSelect, { target: { value: "PENDIENTE" } });

    fireEvent.click(screen.getByRole("button", { name: /Guardar/i }));

    expect(mockRegistrar).toHaveBeenCalledOnce();
    const [callArgs] = mockRegistrar.mock.calls;
    expect(callArgs[0].cmn_adjunto).toBe("PENDIENTE");
    expect(callArgs[0].area_usuaria).toBe("GOBERNANZA");
  });
});

describe("TablaAreasE24 — codigoEtapa='E24' (default)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT render CMN column header", () => {
    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: [],
        areasUsuarias,
        codigoEtapa: "E24",
      }),
      { wrapper: Wrapper }
    );

    expect(screen.queryByRole("columnheader", { name: "CMN" })).not.toBeInTheDocument();
  });

  it("does NOT render CMN select when editing", () => {
    const filaE24: FilaArea = {
      id: 20,
      area_usuaria: "DTDIS",
      estado_etapa: "COMPLETADO",
      fecha_inicio: "2026-05-01",
      fecha_fin: null,
      dias: null,
    };

    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: [filaE24],
        areasUsuarias: ["DTDIS"],
        codigoEtapa: "E24",
      }),
      { wrapper: Wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Editar conformidad DTDIS/i }));

    expect(screen.queryByRole("combobox", { name: /CMN para DTDIS/i })).not.toBeInTheDocument();
  });

  it("does NOT include cmn_adjunto in actualizar payload", () => {
    const filaE24: FilaArea = {
      id: 20,
      area_usuaria: "DTDIS",
      estado_etapa: "COMPLETADO",
      fecha_inicio: "2026-05-01",
      fecha_fin: null,
      dias: null,
    };

    render(
      React.createElement(TablaAreasE24, {
        procesoId: 1,
        filas: [filaE24],
        areasUsuarias: ["DTDIS"],
        codigoEtapa: "E24",
      }),
      { wrapper: Wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Editar conformidad DTDIS/i }));
    fireEvent.click(screen.getByRole("button", { name: /Guardar/i }));

    expect(mockActualizar).toHaveBeenCalledOnce();
    const [callArgs] = mockActualizar.mock.calls;
    expect(callArgs[0].payload.cmn_adjunto).toBeUndefined();
  });
});
