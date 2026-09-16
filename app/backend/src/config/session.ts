import session from 'express-session'
import { env } from '@/config/env'
import { sessionStore } from '@/config/container'
import { SESSION_TTL_MS } from '@/config/sessionStore'

export const sessionMiddleware = session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
  },
})
