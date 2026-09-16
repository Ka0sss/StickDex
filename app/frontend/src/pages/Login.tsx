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

    // Validación inline inicial
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
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
        <p className="mt-1 text-sm text-slate-600">
          Accede a tu cuenta para gestionar tus colecciones
        </p>

        {generalError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
            {generalError}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
              }}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
              placeholder="tu@email.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }))
              }}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none ${
                fieldErrors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
