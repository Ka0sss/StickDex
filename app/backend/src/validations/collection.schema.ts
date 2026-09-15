import { z } from 'zod'

export const collectionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
