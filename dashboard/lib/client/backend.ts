const frontendApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'

export function getApiBaseUrl() {
  return frontendApiBase.replace(/\/$/, '')
}

export async function fetchBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const res = await fetch(`${base}${normalizedPath}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    throw new Error(`Backend request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}
