"use client";

/**
 * (dashboard) group layout — client-side guard (defence-in-depth behind middleware)
 * + header with logged-in user info and logout button.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { ReactQueryProvider } from "@/lib/queryClient";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();

  // Zustand-persist rehydrates from localStorage on the client. On a hard page
  // load the first render has token=null until rehydration finishes, so we MUST
  // wait for hydration before deciding to redirect — otherwise an authenticated
  // user gets bounced to /login on every full reload.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  // Client-side guard (defence-in-depth behind the middleware), post-hydration.
  useEffect(() => {
    if (hydrated && !token) {
      router.push("/login");
    }
  }, [hydrated, token, router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface text-sm">Cargando…</p>
      </div>
    );
  }

  if (!token) {
    return null; // Render nothing while redirect fires.
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white px-6 py-3 flex items-center justify-between shadow-card">
        <span className="font-bold text-sm">Adquisiciones TIC — INEI</span>
        <div className="flex items-center gap-4 text-sm">
          {user && (
            <span className="opacity-90">
              {user.username}{" "}
              <span className="text-xs opacity-70">({user.rol})</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-white text-primary font-semibold px-3 py-1 rounded text-xs
                       hover:bg-gray-100 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Page content — wrapped in ReactQueryProvider (client subtree safe) */}
      <main className="flex-1 p-6">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </main>
    </div>
  );
}
