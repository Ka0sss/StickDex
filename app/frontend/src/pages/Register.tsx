import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getFieldErrors } from '@/services/api'
import { registerSchema } from '@/validations/auth.schema'
import { fieldErrors as zodFieldErrors } from '@/validations/common'
import '@/validations/errorMap'

/** Errores del servidor: por campo (`fieldErrors`) o de formulario (clave `_form`). */
function serverErrors(
  err: unknown,
  fallback: string,
): { fields: Record<string, string>; form: string | null } {
  const { _form, ...fields } = getFieldErrors(err)
  if (_form) return { fields, form: _form }
  if (Object.keys(fields).length > 0) return { fields, form: null }
  return { fields, form: err instanceof Error ? err.message : fallback }
}

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setFieldErrors({})

    const result = registerSchema.safeParse({ username, email, password })
    if (!result.success) {
      setFieldErrors(zodFieldErrors(result.error))
      return
    }

    setLoading(true)
    try {
      await register(result.data.username, result.data.email, result.data.password)
      navigate('/albums')
    } catch (err: unknown) {
      const { fields, form } = serverErrors(err, 'Error al registrarse')
      setFieldErrors(fields)
      setGeneralError(form)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-12">
      <div className="rounded-2xl border border-binder-700/80 bg-binder-900/90 p-8 shadow-2xl shadow-black/50 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="mt-4 font-display text-2xl font-black text-white">Únete a StickDex</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Empieza a coleccionar, pegar láminas e intercambiar repetidas
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
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: '' }))
              }}
              className={`mt-1.5 w-full rounded-xl border bg-binder-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                fieldErrors.username
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-binder-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
              }`}
              placeholder="coleccionista123"
            />
            {fieldErrors.username && (
              <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.username}</p>
            )}
          </div>

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
                  : 'border-binder-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
              }`}
              placeholder="tu@email.com"
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Contraseña (mínimo 8 caracteres)
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
                  : 'border-binder-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
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
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-amber-400 hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
