import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { StickDexLogo } from './StickDexLogo'

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
    <nav className="sticky top-0 z-40 border-b border-binder-700/60 bg-binder-900/90 backdrop-blur-md shadow-lg shadow-black/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Links */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="group flex items-center">
            <StickDexLogo size="md" showText={true} />
          </Link>

          <div className="hidden sm:flex sm:items-center sm:space-x-1.5 pl-2 border-l border-binder-800">
            <Link
              to="/albums"
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                isAlbums
                  ? 'bg-indigo-600/20 text-amber-400 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-binder-800/60'
              }`}
            >
              Álbumes
            </Link>
            <Link
              to="/collections"
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                isCollections
                  ? 'bg-indigo-600/20 text-amber-400 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
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
              <div className="flex items-center space-x-2.5 rounded-full border border-binder-700/80 bg-binder-950/80 px-3.5 py-1 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[10px] font-black text-slate-950 shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="font-bold text-slate-200">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-binder-700 bg-binder-800/60 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-red-950/40 hover:border-red-700/60 hover:text-red-300"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-binder-800/60 transition"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/25 transition hover:brightness-110"
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
