import { getToken } from "./auth";
import type { Meeting } from "./types";

const API_URL = "http://localhost:3000";

/** Generic fetch wrapper that injects the JWT and handles errors. */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
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

export const requestCode = (email: string) =>
  request<{ message: string }>("/api/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyCode = (email: string, code: string) =>
  request<{ token: string }>("/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

export const validateToken = (token: string) =>
  request<{ valid: boolean; email: string }>("/api/auth/validate-token", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

// ── Meetings ────────────────────────────────────────────────────────

export const getMeetings = () => request<Meeting[]>("/api/items");

export const getMeeting = (id: string) => request<Meeting>(`/api/items/${id}`);

export const joinMeeting = (id: string) =>
  request<Meeting>(`/api/items/${id}/join`, { method: "POST" });

export const leaveMeeting = (id: string) =>
  request<Meeting>(`/api/items/${id}/leave`, { method: "POST" });

export const deleteMeeting = (id: string) =>
  request<{ message: string }>(`/api/items/${id}`, { method: "DELETE" });

/** Download an .ics file and trigger save-as dialog. */
export const downloadICS = async (id: string, filename: string) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/items/${id}/ics`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error("Failed to download calendar invite");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename.replace(/[^a-zA-Z0-9 ]/g, "")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};
