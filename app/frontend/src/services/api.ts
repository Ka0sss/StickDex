export interface ZodErrorDetails {
  formErrors?: string[]
  fieldErrors?: Record<string, string[]>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: ZodErrorDetails,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function getFieldErrors(err: unknown): Record<string, string> {
  if (err instanceof ApiError && err.details?.fieldErrors) {
    const result: Record<string, string> = {}
    for (const [field, messages] of Object.entries(err.details.fieldErrors)) {
      if (messages && messages.length > 0) {
        result[field] = messages[0]
      }
    }
    return result
  }
  return {}
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData
  const headers = new Headers(init?.headers)

  if (!isFormData && !headers.has('Content-Type') && init?.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(
      res.status,
      body?.message ?? `Error ${res.status}`,
      body?.details,
    )
  }

  return res.json() as Promise<T>
}
