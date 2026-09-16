import { z } from 'zod'

/** Máximo de bytes que bcrypt procesa: más allá se trunca en silencio. */
const MAX_PASSWORD_BYTES = 72

const email = z.string().trim().toLowerCase().email({ message: 'Email inválido' })

const password = z
  .string()
  .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  .refine((value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES, {
    message: `La contraseña no puede superar ${MAX_PASSWORD_BYTES} bytes`,
  })

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
    .max(30, { message: 'El nombre de usuario no puede superar 30 caracteres' })
    .regex(/^[\p{L}\p{N}_.-]+$/u, {
      message: 'Solo se permiten letras, números, punto, guion y guion bajo',
    }),
  email,
  password,
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { message: 'La contraseña es obligatoria' }),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
