import type { Request, Response } from 'express'
import { authService } from '../services/auth.service'
import type { LoginInput, RegisterInput } from '../validations/auth.schema'

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body as RegisterInput)
    req.session.userId = user.id
    res.status(201).json(user)
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput
    const user = await authService.login(email, password)
    req.session.userId = user.id
    res.json(user)
  },

  async logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'internal_error', message: 'Error al cerrar sesión' })
      }
      res.status(200).json({ message: 'Sesión cerrada' })
    })
  },

  async me(req: Request, res: Response) {
    res.json(await authService.me(req.session.userId!))
  },
}
