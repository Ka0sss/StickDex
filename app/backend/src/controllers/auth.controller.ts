import type { Request, Response } from 'express'
import type { IAuthService } from '@/interfaces/auth.service.interface'
import type { LoginInput, RegisterInput } from '@/validations/auth.schema'
import { asyncHandler } from '@/utils/asyncHandler'
import { sessionUserId } from '@/utils/sessionUser'

export class AuthController {
  constructor(private readonly auth: IAuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.auth.register(req.body as RegisterInput)
    req.session.userId = user.id
    res.status(201).json(user)
  })

  login = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.auth.login(req.body as LoginInput)
    req.session.userId = user.id
    res.json(user)
  })

  logout = (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'internal_error', message: 'Error al cerrar sesión' })
      }
      res.status(200).json({ message: 'Sesión cerrada' })
    })
  }

  me = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.auth.me(sessionUserId(req)))
  })
}
