import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFieldErrors } from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setFieldErrors({})

    const errors: Record<string, string> = {}
    if (!email.trim()) errors.email = 'El email es obligatorio'
    if (!password) errors.password = 'La contraseña es obligatoria'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate('/albums')
    } catch (err: unknown) {
      const zErrors = getFieldErrors(err)
      if (Object.keys(zErrors).length > 0) {
        setFieldErrors(zErrors)
      } else {
        setGeneralError(err instanceof Error ? err.message : 'Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-12">
      <div className="rounded-2xl border border-binder-700/80 bg-binder-900/90 p-8 shadow-2xl shadow-black/50 backdrop-blur-sm">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-2xl shadow-lg shadow-amber-500/20">
            ⚡
          </span>
          <h2 className="mt-4 font-display text-2xl font-black text-white">Bienvenido de vuelta</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Ingresa a tu cuenta para gestionar tus álbumes y láminas
          </p>
        </div>

        {generalError && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
            {generalError}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
              }}
              className={`mt-1.5 w-full rounded-xl border bg-binder-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-binder-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              }`}
              placeholder="tu@email.com"
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }))
              }}
              className={`mt-1.5 w-full rounded-xl border bg-binder-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                fieldErrors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-binder-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-bold text-amber-400 hover:underline">
            Crea una aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
