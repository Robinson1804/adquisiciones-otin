"use client";

/**
 * Dashboard placeholder page — C1 requirement §13 / Spec S-15.
 * Displays the logged-in user's identity fields read from authStore.
 * No real data required in C1.
 */

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="bg-white rounded-lg border border-outline shadow-card p-6">
        <h1 className="text-xl font-bold text-primary mb-4">
          Panel de control
        </h1>

        {user ? (
          <dl className="space-y-3 text-sm">
            <div className="flex gap-2">
              <dt className="font-semibold text-on-surface w-36">Usuario:</dt>
              <dd className="text-gray-700">{user.username}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-on-surface w-36">Nombre completo:</dt>
              <dd className="text-gray-700">{user.nombre_completo}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-on-surface w-36">Rol:</dt>
              <dd className="text-gray-700">{user.rol}</dd>
            </div>
            {user.area && (
              <div className="flex gap-2">
                <dt className="font-semibold text-on-surface w-36">Área:</dt>
                <dd className="text-gray-700">{user.area}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-gray-500 text-sm">Cargando información...</p>
        )}

        <hr className="my-5 border-outline" />

        <p className="text-xs text-gray-400 mb-4">
          Panel en construcción — C1 placeholder.
        </p>

        <button
          onClick={handleLogout}
          className="bg-primary text-white font-semibold px-4 py-2 rounded text-sm
                     hover:bg-primary-container transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
