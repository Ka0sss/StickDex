import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isAlbums = location.pathname.startsWith('/albums')
  const isCollections = location.pathname.startsWith('/collections')

  return (
    <nav className="sticky top-0 z-40 border-b border-binder-700/60 bg-binder-900/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand & Links */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="group flex items-center space-x-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-base font-black text-slate-950 shadow-md shadow-amber-500/20 transition group-hover:scale-105">
              ⚡
            </span>
            <span className="font-display text-2xl font-black tracking-tight text-white transition group-hover:text-amber-400">
              Stick<span className="text-amber-400">Dex</span>
            </span>
          </Link>

          <div className="hidden sm:flex sm:items-center sm:space-x-1.5">
            <Link
              to="/albums"
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                isAlbums
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-binder-800/60'
              }`}
            >
              Álbumes
            </Link>
            <Link
              to="/collections"
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                isCollections
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-binder-800/60'
              }`}
            >
              Colecciones
            </Link>
          </div>
        </div>

        {/* User Auth controls */}
        <div className="flex items-center space-x-3">
          {loading ? (
            <span className="text-xs text-slate-500">Cargando sesión...</span>
          ) : user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 rounded-full border border-binder-700/80 bg-binder-800/80 px-3 py-1 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-950">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold text-slate-200">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-binder-700 bg-binder-800/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-red-950/40 hover:border-red-700/60 hover:text-red-300"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-binder-800/60"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 transition hover:brightness-110"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
