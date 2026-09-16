import { expect } from 'vitest'
import { HttpError } from '@/utils/httpError'

/** Verifica que la promesa falle con un `HttpError` del status y mensaje indicados. */
export async function expectHttpError(
  promise: Promise<unknown>,
  status: number,
  message: string,
): Promise<void> {
  const rejection: unknown = await promise.then(
    () => null,
    (reason: unknown) => reason,
  )

  expect(rejection).toBeInstanceOf(HttpError)
  expect(rejection instanceof HttpError ? rejection.status : null).toBe(status)
  expect(rejection instanceof HttpError ? rejection.message : null).toBe(message)
}
