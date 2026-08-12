"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchCities, fetchSpaces } from "@/lib/api";
import type { Space, SpaceType } from "@/types";
import { SpaceCard } from "@/components/SpaceCard";

interface Filters {
  q: string;
  city: string;
  type: "" | SpaceType;
  minPrice: string;
  maxPrice: string;
}

const initialFilters: Filters = {
  q: "",
  city: "",
  type: "",
  minPrice: "",
  maxPrice: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export default function SearchPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [cities, setCities] = useState<string[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  const runSearch = useCallback(async (filtersToApply: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const spacesFound = await fetchSpaces({
        q: filtersToApply.q.trim() || undefined,
        city: filtersToApply.city || undefined,
        type: filtersToApply.type || undefined,
        minPrice: filtersToApply.minPrice
          ? Number(filtersToApply.minPrice)
          : undefined,
        maxPrice: filtersToApply.maxPrice
          ? Number(filtersToApply.maxPrice)
          : undefined,
      });
      setSpaces(spacesFound);
    } catch {
      setError("No se pudieron cargar los espacios. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces()
      .then(setSpaces)
      .catch(() =>
        setError("No se pudieron cargar los espacios. Inténtalo de nuevo."),
      )
      .finally(() => setLoading(false));
  }, []);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(filters);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  const resetFilters = () => {
    setFilters(initialFilters);
    void runSearch(initialFilters);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Buscar espacios</h1>
      <p className="mt-2 text-gray-600">
        Encuentra escritorios y oficinas privadas por ciudad, tipo y precio.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="sm:col-span-2">
          <label
            htmlFor="q"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Buscar por nombre o descripción
          </label>
          <input
            id="q"
            type="text"
            value={filters.q}
            onChange={(event) => updateFilter("q", event.target.value)}
            placeholder="Ej. The Vault, vista al mar..."
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="city"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Ciudad
          </label>
          <select
            id="city"
            value={filters.city}
            onChange={(event) => updateFilter("city", event.target.value)}
            className={inputClass}
          >
            <option value="">Todas</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="type"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Tipo de espacio
          </label>
          <select
            id="type"
            value={filters.type}
            onChange={(event) =>
              updateFilter("type", event.target.value as Filters["type"])
            }
            className={inputClass}
          >
            <option value="">Todos</option>
            <option value="DESK">Escritorio</option>
            <option value="PRIVATE_OFFICE">Oficina privada</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="minPrice"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Precio mínimo ($/h)
          </label>
          <input
            id="minPrice"
            type="number"
            min="0"
            step="0.01"
            value={filters.minPrice}
            onChange={(event) => updateFilter("minPrice", event.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="maxPrice"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Precio máximo ($/h)
          </label>
          <input
            id="maxPrice"
            type="number"
            min="0"
            step="0.01"
            value={filters.maxPrice}
            onChange={(event) => updateFilter("maxPrice", event.target.value)}
            placeholder="15"
            className={inputClass}
          />
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Buscar
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </form>

      <div className="mt-8">
        {loading ? (
          <p className="py-16 text-center text-gray-500">
            Cargando espacios...
          </p>
        ) : error ? (
          <p className="py-16 text-center text-red-600">{error}</p>
        ) : spaces.length === 0 ? (
          <p className="py-16 text-center text-gray-500">
            No se encontraron espacios con esos criterios.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              {spaces.length}{" "}
              {spaces.length === 1 ? "espacio disponible" : "espacios disponibles"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space) => (
                <Link key={space.id} href={`/spaces/${space.id}`}>
                  <SpaceCard space={space} />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
