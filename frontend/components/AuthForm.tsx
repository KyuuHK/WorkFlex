"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";

interface AuthFormProps {
  mode: "login" | "register";
  redirectTo?: string;
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password, redirectTo);
      } else {
        await register(name, email, password, redirectTo);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isLogin
            ? "Log in to manage your reservations."
            : "Start reserving coworking spaces in minutes."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Jose Abrego"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Minimum 8 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Please wait..."
              : isLogin
                ? "Log in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {isLogin ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-indigo-600 hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
