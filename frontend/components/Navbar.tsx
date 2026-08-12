"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
            W
          </span>
          WorkFlex
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/search"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Buscar
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <span className="hidden text-sm text-gray-500 sm:inline">
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/search"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Buscar
              </Link>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
