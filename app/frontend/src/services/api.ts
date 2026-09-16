export interface ApiIssue {
  path: string
  message: string
}

/** Detalle de error devuelto por el backend: `{ error, message, details }`. */
export interface ApiErrorDetails {
  source?: 'body' | 'query' | 'params' | 'file'
  fieldErrors?: Record<string, string[]>
  issues?: ApiIssue[]
  [key: string]: unknown
}

interface ApiErrorBody {
  error?: string
  message?: string
  details?: ApiErrorDetails
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
    public readonly details?: ApiErrorDetails,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

export function getIssues(err: unknown): ApiIssue[] {
  if (!isApiError(err)) return []
  return err.details?.issues ?? []
}

/**
 * Errores por campo listos para pintar bajo cada input. Si el backend solo
 * devuelve un error de formulario (ruta vacía) se expone en la clave `_form`.
 */
export function getFieldErrors(err: unknown): Record<string, string> {
  if (!isApiError(err)) return {}

  const fieldErrors = err.details?.fieldErrors
  if (fieldErrors) {
    const result: Record<string, string> = {}
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages && messages.length > 0) result[field] = messages[0]
    }
    if (Object.keys(result).length > 0) return result
  }

  const firstIssue = getIssues(err)[0]
  if (firstIssue) return { [firstIssue.path || '_form']: firstIssue.message }
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
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(
      res.status,
      body?.message ?? `Error ${res.status}`,
      body?.error ?? 'http_error',
      body?.details,
    )
  }

  return res.json() as Promise<T>
}
