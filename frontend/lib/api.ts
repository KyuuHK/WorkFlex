import axios from "axios";
import type { AuthErrorResponse, Space, SpaceQuery } from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = window.localStorage.getItem("workflex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<AuthErrorResponse>(error)) {
    const data = error.response?.data;
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return "Something went wrong, please try again.";
  }
  return "Unexpected error, please try again.";
}

export async function fetchSpaces(query?: SpaceQuery): Promise<Space[]> {
  const { data } = await api.get<Space[]>("/spaces", { params: query });
  return data;
}

export async function fetchCities(): Promise<string[]> {
  const { data } = await api.get<string[]>("/spaces/cities");
  return data;
}
