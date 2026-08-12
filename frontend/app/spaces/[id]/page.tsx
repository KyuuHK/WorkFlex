"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createReservation,
  fetchAvailability,
  fetchSpace,
  getErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AvailabilitySlot, Space, SpaceType } from "@/types";

const typeLabels: Record<SpaceType, string> = {
  DESK: "Escritorio",
  PRIVATE_OFFICE: "Oficina privada",
};

function todayISO(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function SpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const id = params.id;

  const [space, setSpace] = useState<Space | null>(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSpace(id)
      .then(setSpace)
      .catch(() =>
        setError("No se pudo cargar el espacio. Inténtalo de nuevo."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchAvailability(id, date)
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [id, date]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
    setSelectedStart(null);
    setMessage(null);
  };

  const requiredSlots = useMemo(() => {
    if (!selectedStart) return [];
    const startIndex = slots.findIndex((slot) => slot.startAt === selectedStart);
    if (startIndex === -1) return [];
    return slots.slice(startIndex, startIndex + duration);
  }, [slots, selectedStart, duration]);

  const canBook =
    requiredSlots.length === duration && requiredSlots.every((slot) => slot.available);

  const endAt = useMemo(() => {
    if (!selectedStart) return null;
    return new Date(
      new Date(selectedStart).getTime() + duration * 60 * 60 * 1000,
    ).toISOString();
  }, [selectedStart, duration]);

  const handleBook = async () => {
    if (!canBook || !selectedStart || !endAt) return;
    setBooking(true);
    setMessage(null);
    try {
      await createReservation({ spaceId: id, startAt: selectedStart, endAt });
      setMessage({ type: "success", text: "¡Reserva confirmada!" });
      setSelectedStart(null);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      const freshSlots = await fetchAvailability(id, date);
      setSlots(freshSlots);
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-gray-500">
        Cargando espacio...
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-red-600">{error ?? "Espacio no encontrado."}</p>
        <Link
          href="/search"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Volver a la búsqueda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href="/search"
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Volver a la búsqueda
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                space.type === "PRIVATE_OFFICE"
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {typeLabels[space.type]}
            </span>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {space.name}
            </h1>
            <p className="mt-1 text-gray-600">{space.city}</p>
            <p className="mt-4 text-gray-600">{space.description}</p>
            <dl className="mt-6 space-y-3 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Precio por hora</dt>
                <dd className="font-semibold text-gray-900">
                  ${space.pricePerHour.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Capacidad</dt>
                <dd className="font-semibold text-gray-900">
                  {space.capacity} persona{space.capacity > 1 ? "s" : ""}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Reservar este espacio
            </h2>

            {!user ? (
              <div className="mt-4 rounded-xl bg-indigo-50 p-6 text-center">
                <p className="text-sm text-gray-700">
                  Inicia sesión o crea una cuenta para reservar.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Link
                    href={`/login?redirect=/spaces/${space.id}`}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Crear cuenta
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="date"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Fecha
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={handleDateChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="duration"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Duración
                    </label>
                    <select
                      id="duration"
                      value={duration}
                      onChange={(event) => {
                        setDuration(Number(event.target.value));
                        setMessage(null);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      {[1, 2, 3, 4].map((hours) => (
                        <option key={hours} value={hours}>
                          {hours} hora{hours > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="mt-5 text-sm font-medium text-gray-700">
                  Horarios disponibles ({date})
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((slot) => {
                    const isSelected = slot.startAt === selectedStart;
                    const covered = requiredSlots.some(
                      (required) => required.startAt === slot.startAt,
                    );
                    const disabled = !slot.available;
                    return (
                      <button
                        key={slot.startAt}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setSelectedStart(isSelected ? null : slot.startAt);
                          setMessage(null);
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : disabled
                              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 line-through"
                              : covered
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                        }`}
                      >
                        {formatHour(slot.startAt)}
                      </button>
                    );
                  })}
                </div>

                {selectedStart && !canBook && (
                  <p className="mt-3 text-sm text-amber-700">
                    El rango seleccionado incluye horas ya reservadas. Elige
                    otro horario o reduce la duración.
                  </p>
                )}

                {message && (
                  <p
                    className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                      message.type === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {message.text}
                  </p>
                )}

                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="button"
                    disabled={!canBook || booking}
                    onClick={handleBook}
                    className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {booking ? "Reservando..." : "Reservar"}
                  </button>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Ver mis reservas
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
