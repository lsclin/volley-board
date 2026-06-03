"use client";

let clientId: string | null = null;

export function getClientId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  if (!clientId) {
    clientId = localStorage.getItem("volley_client_id");
  }

  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem("volley_client_id", clientId);
  }

  return clientId;
}