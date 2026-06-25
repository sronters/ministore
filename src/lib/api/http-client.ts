const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("minbasket_token");
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API_${response.status}`);
  }

  return response.json() as Promise<T>;
}
