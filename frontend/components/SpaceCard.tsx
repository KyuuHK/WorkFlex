import type { Space, SpaceType } from "@/types";

const typeLabels: Record<SpaceType, string> = {
  DESK: "Escritorio",
  PRIVATE_OFFICE: "Oficina privada",
};

export function SpaceCard({ space }: { space: Space }) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            space.type === "PRIVATE_OFFICE"
              ? "bg-indigo-50 text-indigo-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {typeLabels[space.type]}
        </span>
        <span className="text-lg font-bold text-indigo-600">
          ${space.pricePerHour.toFixed(2)}
          <span className="text-xs font-medium text-gray-500">/hora</span>
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-900">{space.name}</h3>
      <p className="text-sm text-gray-600">{space.city}</p>
      <p className="mt-3 flex-1 text-sm text-gray-500">
        {space.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">
          Capacidad: <span className="font-medium text-gray-700">{space.capacity}</span>
        </span>
      </div>
    </div>
  );
}
