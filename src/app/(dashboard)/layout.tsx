"use client";

/**
 * (dashboard) group layout — client-side guard (defence-in-depth behind middleware)
 * + header with logged-in user info and logout button.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();

  // Client-side guard — redundant with middleware, prevents brief flash.
  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  function handleLogout() {
    logout();
    router.push("/login");
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

      {/* Page content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
