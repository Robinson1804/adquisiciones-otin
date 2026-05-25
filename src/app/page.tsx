import HealthStatus from "@/components/HealthStatus";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary">
            Adquisiciones TIC
          </h1>
          <p className="text-sm text-on-surface mt-1">
            INEI — Oficina de Tecnología de la Información (OTIN)
          </p>
        </header>
        <HealthStatus />
      </div>
    </main>
  );
}
