/**
 * C3a — TablaAreasE11 tests.
 * WU-12: Shows running total; 2 rows + footer sum.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TablaAreasE11 } from "@/components/procesos/TablaAreasE11";
import type { FilaArea } from "@/types/etapa";

// Mock hooks
vi.mock("@/hooks/useEtapas", () => ({
  useRegistrarEtapa: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useActualizarEtapa: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useReiniciarTdr: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

const areasUsuarias = ['DTDIS', 'GOBERNANZA'];

const filas: FilaArea[] = [
  {
    id: 1,
    area_usuaria: 'DTDIS',
    estado_etapa: 'COMPLETADO',
    fecha_inicio: '2026-05-01',
    fecha_fin: null,
    dias: null,
    monto_cert: 80000,
  },
  {
    id: 2,
    area_usuaria: 'GOBERNANZA',
    estado_etapa: 'COMPLETADO',
    fecha_inicio: '2026-05-02',
    fecha_fin: null,
    dias: null,
    monto_cert: 70000,
  },
];

describe("TablaAreasE11", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 2 rows for 2 areas", () => {
    render(
      React.createElement(TablaAreasE11, { procesoId: 1, filas, areasUsuarias }),
      { wrapper: Wrapper }
    );

    expect(screen.getByTestId("e11-row-DTDIS")).toBeInTheDocument();
    expect(screen.getByTestId("e11-row-GOBERNANZA")).toBeInTheDocument();
  });

  it("shows running total of monto_cert across all rows", () => {
    render(
      React.createElement(TablaAreasE11, { procesoId: 1, filas, areasUsuarias }),
      { wrapper: Wrapper }
    );

    // Total = 80000 + 70000 = 150000
    const totalEl = screen.getByTestId("e11-total");
    expect(totalEl.textContent).toMatch(/150[,.]?000/);
  });

  it("renders Registrar button for area with no existing fila", () => {
    render(
      React.createElement(TablaAreasE11, {
        procesoId: 1,
        filas: [],
        areasUsuarias: ['DTDIS'],
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('button', { name: /Registrar DTDIS/i })).toBeInTheDocument();
  });

  it("renders Editar button for area with existing fila", () => {
    render(
      React.createElement(TablaAreasE11, {
        procesoId: 1,
        filas: [filas[0]],
        areasUsuarias: ['DTDIS'],
      }),
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('button', { name: /Editar DTDIS/i })).toBeInTheDocument();
  });
});
