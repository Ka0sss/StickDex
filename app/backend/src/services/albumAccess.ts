import { HttpError } from '@/utils/httpError'

/**
 * Autorización por propiedad: un recurso solo puede mutarlo su dueño.
 * Los recursos sin dueño (`userId` nulo) quedan protegidos para todos.
 */
export function assertOwnership(
  ownerId: number | null,
  currentUserId: number,
  message: string,
): void {
  if (ownerId !== currentUserId) throw new HttpError(403, message)
}
