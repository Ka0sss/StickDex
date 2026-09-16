import 'dotenv/config'
import { z } from 'zod'
import '@/validations/errorMap'

const envSchema = z.object({
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL es obligatoria' })
    .url({ message: 'DATABASE_URL debe ser una URL válida' })
    .startsWith('mysql://', { message: 'DATABASE_URL debe apuntar a MySQL (mysql://...)' }),
  SESSION_SECRET: z
    .string({ required_error: 'SESSION_SECRET es obligatoria' })
    .min(32, { message: 'SESSION_SECRET debe tener al menos 32 caracteres' }),
  PORT: z.coerce
    .number({ invalid_type_error: 'PORT debe ser numérico' })
    .int({ message: 'PORT debe ser un puerto entero' })
    .min(1, { message: 'PORT debe estar entre 1 y 65535' })
    .max(65535, { message: 'PORT debe estar entre 1 y 65535' })
    .default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
