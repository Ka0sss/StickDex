import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-xl font-black tracking-tight text-indigo-600">
            StickDex
          </Link>
          <div className="flex space-x-4">
            <Link
              to="/albums"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              Álbumes
            </Link>
            <Link
              to="/collections"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              Colecciones
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {loading ? (
            <span className="text-xs text-slate-400">Cargando...</span>
          ) : user ? (
            <>
              <span className="text-sm font-medium text-slate-600">
                Hola, <span className="font-bold text-slate-900">{user.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-indigo-600"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
