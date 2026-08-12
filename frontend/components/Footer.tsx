export function Footer() {
  return (
    <footer className="border-t border-gray-200 py-6">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
        <p>
          WorkFlex · Reserva espacios de coworking para nómadas digitales,
          freelancers y equipos remotos.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Desarrollado por{" "}
          <span className="font-semibold text-gray-500">Beyond Studios</span> ·
          Proyecto académico · Jose Abrego · Kevin Rodriguez · Giuseppe Toscano
        </p>
        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
          <a
            href="/documento-de-alcance-workflex.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 underline-offset-2 transition-colors hover:text-gray-700 hover:underline"
          >
            Ayuda
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/acta-de-constitucion-workflex.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 underline-offset-2 transition-colors hover:text-gray-700 hover:underline"
          >
            Acta de Constitución
          </a>
        </p>
      </div>
    </footer>
  );
}
