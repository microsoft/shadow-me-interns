import { getToken } from "./auth";
import type { Intern, Meeting } from "./types";

const API_URL =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://intern-support-server-cbbveab9ewdtd6c6.swedencentral-01.azurewebsites.net"
    : "http://localhost:3000";

/** Generic fetch wrapper that injects the Entra ID token and handles errors. */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message ||
        `Request failed (${res.status})`,
    );
  }

  return res.json() as Promise<T>;
}

// ── Auth ────────────────────────────────────────────────────────────

export const getMe = () => request<{ email: string; whitelisted: boolean }>("/api/auth/me");

// ── Meetings ────────────────────────────────────────────────────────

export const getMeetings = () => request<Meeting[]>("/api/items");

export const getMeeting = (id: string) => request<Meeting>(`/api/items/${id}`);

export const joinMeeting = (id: string) =>
  request<Meeting>(`/api/items/${id}/join`, { method: "POST" });

export const leaveMeeting = (id: string) =>
  request<Meeting>(`/api/items/${id}/leave`, { method: "POST" });

export const deleteMeeting = (id: string) =>
  request<{ message: string }>(`/api/items/${id}`, { method: "DELETE" });

// ── Interns ─────────────────────────────────────────────────────────

export const getInterns = () => request<Intern[]>("/api/interns");
