import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'
import { HttpError } from '@/utils/httpError'

export type ValidationSource = 'body' | 'query' | 'params' | 'file'

export function validate(schema: ZodTypeAny, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const value = source === 'file' ? req.file : req[source]
    const result = schema.safeParse(value)

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

    // `req.file` lo construye multer con datos que sí se usan después (filename, path):
    // se valida pero no se reemplaza por el resultado del parseo.
    if (source === 'file') {
      next()
      return
    }

    ;(req as unknown as Record<string, unknown>)[source] = result.data
    next()
  }
}
