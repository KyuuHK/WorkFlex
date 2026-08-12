import Link from "next/link";

const features = [
  {
    title: "Busca tu espacio ideal",
    description:
      "Filtra por ciudad, costo y tipo de espacio: oficina privada o escritorio.",
  },
  {
    title: "Reserva en tiempo real",
    description:
      "Selecciona fechas y horarios viendo la disponibilidad en vivo, sin sobrecupos.",
  },
  {
    title: "Confirmación automática",
    description:
      "Recibe el detalle de tu reserva por correo, listo para imprimir.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Espacios de coworking reservados{" "}
            <span className="text-indigo-600">en tiempo real</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            WorkFlex te conecta con oficinas privadas y escritorios disponibles
            en tu ciudad. Encuentra, reserva y trabaja sin fricciones.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/search"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Buscar espacios
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
