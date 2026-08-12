"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import {
  cancelReservation,
  fetchReservations,
  getErrorMessage,
} from "@/lib/api";
import type { Reservation, ReservationStatus } from "@/types";

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
};

const statusStyles: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function reservationTotal(reservation: Reservation): string {
  const hours =
    (new Date(reservation.endAt).getTime() -
      new Date(reservation.startAt).getTime()) /
    (60 * 60 * 1000);
  return (hours * reservation.space.pricePerHour).toFixed(2);
}

export default function DashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations()
      .then(setReservations)
      .catch(() => setError("No se pudieron cargar tus reservas."))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    setError(null);
    try {
      const updated = await cancelReservation(id);
      setReservations((previous) =>
        previous.map((reservation) =>
          reservation.id === id ? updated : reservation,
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis reservas</h1>
            <p className="mt-2 text-gray-600">
              Gestiona tus reservas de espacios activos.
            </p>
          </div>
          <Link
            href="/search"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Buscar espacios
          </Link>
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="py-16 text-center text-gray-500">
              Cargando reservas...
            </p>
          ) : reservations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
              <p>No tienes reservas todavía.</p>
              <p className="mt-1 text-sm">
                Explora el catálogo y reserva tu primer espacio.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {reservations.map((reservation) => {
                const cancelled = reservation.status === "CANCELLED";
                return (
                  <li
                    key={reservation.id}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {reservation.space.name}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[reservation.status]}`}
                          >
                            {statusLabels[reservation.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {reservation.space.city}
                        </p>
                        <p className="mt-3 text-sm text-gray-700">
                          {formatDateTime(reservation.startAt)} —{" "}
                          {formatDateTime(reservation.endAt)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Total: ${reservationTotal(reservation)} ·{" "}
                          {reservation.space.pricePerHour.toFixed(2)}/hora
                        </p>
                      </div>
                      {!cancelled && (
                        <button
                          type="button"
                          disabled={cancellingId === reservation.id}
                          onClick={() => handleCancel(reservation.id)}
                          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingId === reservation.id
                            ? "Cancelando..."
                            : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
