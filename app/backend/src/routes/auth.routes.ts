import { Router } from 'express'
import { authController } from '@/config/container'
import { requireAuth } from '@/middlewares/requireAuth'
import { validate } from '@/middlewares/validate'
import { loginSchema, registerSchema } from '@/validations/auth.schema'

export const authRoutes = Router()

authRoutes.post('/register', validate(registerSchema, 'body'), authController.register)
authRoutes.post('/login', validate(loginSchema, 'body'), authController.login)
authRoutes.post('/logout', authController.logout)
authRoutes.get('/me', requireAuth, authController.me)
