import 'dotenv/config'
import '@/validations/errorMap'
import { envSchema } from '@/validations/env.schema'

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
