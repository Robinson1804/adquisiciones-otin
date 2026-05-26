/**
 * C4 — S7 Dashboard page component tests.
 * Verifies metric cards render and empty state shows for no data.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import type { Metricas, FlujoProcesosResponse } from "@/types/dashboard";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}));

// Mock api
vi.mock("@/lib/api", () => ({
  getMetricas: vi.fn(),
  getFlujoProcesos: vi.fn(),
  getProcesos: vi.fn(),
  getProceso: vi.fn(),
  createProceso: vi.fn(),
  updateProceso: vi.fn(),
  deleteProceso: vi.fn(),
  getEtapas: vi.fn(),
  registrarEtapa: vi.fn(),
  actualizarEtapa: vi.fn(),
  agregarRonda: vi.fn(),
  reiniciarTdr: vi.fn(),
  getMontosProceso: vi.fn(),
  getArchivos: vi.fn(),
  subirArchivo: vi.fn(),
  descargarArchivo: vi.fn(),
  eliminarArchivo: vi.fn(),
  getTiemposEtapa: vi.fn(),
  getPresupuesto: vi.fn(),
  getDemoraAreas: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock authStore
vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    token: "mock-token",
    user: { username: "admin", rol: "ADMIN" },
    logout: vi.fn(),
  }),
}));

import { getMetricas, getFlujoProcesos } from "@/lib/api";

const mockMetricas: Metricas = {
  anno: 2026,
  total: 8,
  en_proceso: 4,
  culminados: 3,
  cancelados: 1,
  pim_total: 250000,
  dias_promedio: 38.5,
};

const mockFlujoProcesos: FlujoProcesosResponse = {
  procesos: [
    {
      id: 1,
      id_proceso: "2026-001",
      requerimiento: "Laptops para DTDIS",
      estado: "EN PROCESO",
      fase_actual: "F2",
      porcentaje: 40,
      fases: [
        { fase: "F1", label: "Requerimiento y TDR",        completada: true,  actual: false },
        { fase: "F2", label: "Indagación y Evaluación",    completada: false, actual: true  },
        { fase: "F3", label: "Presupuesto y Certificación",completada: false, actual: false },
        { fase: "F4", label: "Orden y Ejecución",          completada: false, actual: false },
        { fase: "F5", label: "Conformidad",                completada: false, actual: false },
      ],
    },
  ],
};

const emptyFlujo: FlujoProcesosResponse = { procesos: [] };

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe("S7 DashboardPage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders the page title", async () => {
    vi.mocked(getMetricas).mockResolvedValue(mockMetricas);
    vi.mocked(getFlujoProcesos).mockResolvedValue(mockFlujoProcesos);
    render(<DashboardPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/Dashboard Adquisiciones TIC/i)).toBeTruthy();
  });

  it("shows metric cards with real values after load", async () => {
    vi.mocked(getMetricas).mockResolvedValue(mockMetricas);
    vi.mocked(getFlujoProcesos).mockResolvedValue(mockFlujoProcesos);
    render(<DashboardPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("8")).toBeTruthy(); // Total
    });
    expect(screen.getByText("4")).toBeTruthy();   // En Proceso
    expect(screen.getByText("3")).toBeTruthy();   // Culminados
    expect(screen.getByText("1")).toBeTruthy();   // Cancelados
  });

  it("shows empty state when no procesos", async () => {
    vi.mocked(getMetricas).mockResolvedValue({
      ...mockMetricas,
      total: 0,
      en_proceso: 0,
      culminados: 0,
      cancelados: 0,
    });
    vi.mocked(getFlujoProcesos).mockResolvedValue(emptyFlujo);
    render(<DashboardPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/Sin datos para/i)).toBeTruthy();
    });
  });

  it("shows proceso card with mini timeline", async () => {
    vi.mocked(getMetricas).mockResolvedValue(mockMetricas);
    vi.mocked(getFlujoProcesos).mockResolvedValue(mockFlujoProcesos);
    render(<DashboardPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("2026-001")).toBeTruthy();
    });
    expect(screen.getByText("Laptops para DTDIS")).toBeTruthy();
    // MiniTimeline renders 5 listitem segments
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(5);
  });
});
