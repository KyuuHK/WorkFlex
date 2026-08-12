import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Your dashboard</h1>
        <p className="mt-2 text-gray-600">
          Aquí verás tus reservas activas. El motor de búsqueda y las reservas
          llegan en la siguiente fase.
        </p>
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No tienes reservas todavía.
        </div>
      </div>
    </RequireAuth>
  );
}
