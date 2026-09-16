import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'
import { HttpError } from '@/utils/httpError'

export type ValidationSource = 'body' | 'query' | 'params'

export function validate(schema: ZodTypeAny, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      return next(
        new HttpError(400, 'Entrada inválida', {
          source,
          fieldErrors: result.error.flatten().fieldErrors,
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        }),
      )
    }

    ;(req as unknown as Record<string, unknown>)[source] = result.data
    next()
  }
}
