import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { requireAuth } from '../middlewares/requireAuth'
import { validate } from '../middlewares/validate'
import { asyncHandler } from '../utils/asyncHandler'
import { loginSchema, registerSchema } from '../validations/auth.schema'

export const authRoutes = Router()

authRoutes.post('/register', validate(registerSchema, 'body'), asyncHandler(authController.register))
authRoutes.post('/login', validate(loginSchema, 'body'), asyncHandler(authController.login))
authRoutes.post('/logout', asyncHandler(authController.logout))
authRoutes.get('/me', requireAuth, asyncHandler(authController.me))
