import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, getFieldErrors } from '../services/api'
import type { Album } from '../types'

export default function AlbumsList() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalStickers, setTotalStickers] = useState<number | ''>(10)
  const [releaseDate, setReleaseDate] = useState('')
  const [stickerType, setStickerType] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { user } = useAuth()

  const loadAlbums = async () => {
    try {
      setLoading(true)
      const data = await api<Album[]>('/albums')
      setAlbums(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar álbumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlbums()
  }, [])

  const handleCreateAlbum = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)
    setFieldErrors({})

    const localErrors: Record<string, string> = {}
    if (!name.trim()) localErrors.name = 'El nombre del álbum es obligatorio'
    if (!totalStickers || Number(totalStickers) < 1) {
      localErrors.totalStickers = 'El total de láminas debe ser mayor a 0'
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      setSubmitting(false)
      return
    }

    try {
      let imageUrl: string | undefined = undefined

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const uploadRes = await api<{ imageUrl: string }>('/upload', {
          method: 'POST',
          body: formData,
        })
        imageUrl = uploadRes.imageUrl
      }

      await api<Album>('/albums', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          totalStickers: Number(totalStickers),
          releaseDate: releaseDate || undefined,
          stickerType: stickerType.trim() || undefined,
          imageUrl,
        }),
      })

      setShowModal(false)
      setName('')
      setDescription('')
      setImageFile(null)
      setFieldErrors({})
      await loadAlbums()
    } catch (err: unknown) {
      const zErrors = getFieldErrors(err)
      if (Object.keys(zErrors).length > 0) {
        setFieldErrors(zErrors)
      } else {
        setModalError(err instanceof Error ? err.message : 'Error al crear álbum')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Hero Showcase Header */}
      <div className="flex flex-col justify-between gap-6 pb-6 border-b border-binder-800/80 md:flex-row md:items-end">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <span>Álbumes y Catálogos</span>
            <span>•</span>
            <span>Ediciones Oficiales</span>
          </div>
          <h1 className="mt-1.5 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
            Catálogo de Colección
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">
            Explora las colecciones disponibles, revisa las láminas publicadas e inicia tu propio álbum digital.
          </p>
        </div>

        {user && (
          <button
            onClick={() => {
              setFieldErrors({})
              setModalError(null)
              setShowModal(true)
            }}
            className="inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110"
          >
            <span>+</span>
            <span>Crear Álbum</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-semibold text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          <p className="mt-3 text-xs font-bold tracking-wider text-slate-400">CARGANDO ÁLBUMES...</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-binder-700/80 bg-binder-900/40 py-20 text-center">
          <p className="text-sm font-medium text-slate-400">Aún no hay álbumes registrados en el sistema.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              to={`/albums/${album.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-binder-700/70 bg-binder-900/80 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-indigo-500/15"
            >
              {/* Cover visual */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-binder-950">
                {album.imageUrl ? (
                  <img
                    src={album.imageUrl}
                    alt={album.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-binder-800 to-binder-950 text-5xl font-black text-slate-700">
                    {album.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-binder-950/90 via-transparent to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md border border-amber-400/30">
                    {album.stickerType || 'Fútbol'}
                  </span>
                  <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-mono font-bold text-slate-200 backdrop-blur-md">
                    {album.totalStickers} LÁMINAS
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl font-black text-white transition group-hover:text-amber-400">
                  {album.name}
                </h3>
                {album.description && (
                  <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-400">
                    {album.description}
                  </p>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-binder-800/80 text-[11px] text-slate-500">
                  <span>
                    {album.releaseDate
                      ? `Lanzamiento: ${new Date(album.releaseDate).toLocaleDateString()}`
                      : 'Edición activa'}
                  </span>
                  <span className="font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                    Ver catálogo →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal crear álbum */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-binder-700 bg-binder-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-binder-800 pb-4">
              <h3 className="font-display text-xl font-black text-white">Crear Nuevo Álbum</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
                {modalError}
              </div>
            )}

            <form noValidate onSubmit={handleCreateAlbum} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Nombre del Álbum
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    fieldErrors.name
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-binder-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                  }`}
                  placeholder="Ej. Copa Mundial 2026"
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-binder-700 bg-binder-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  rows={2}
                  placeholder="Breve reseña o temática del álbum..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Total Láminas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalStickers}
                    onChange={(e) => {
                      setTotalStickers(e.target.value === '' ? '' : Number(e.target.value))
                      if (fieldErrors.totalStickers) setFieldErrors((prev) => ({ ...prev, totalStickers: '' }))
                    }}
                    className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2 text-sm text-white focus:outline-none ${
                      fieldErrors.totalStickers
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-binder-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                    }`}
                  />
                  {fieldErrors.totalStickers && (
                    <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.totalStickers}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Categoría / Tipo
                  </label>
                  <input
                    type="text"
                    value={stickerType}
                    onChange={(e) => setStickerType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-binder-700 bg-binder-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    placeholder="Fútbol, Anime..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Fecha de Lanzamiento
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-binder-700 bg-binder-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Foto de Portada (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-binder-800 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-amber-400 hover:file:bg-binder-700"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3 border-t border-binder-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-binder-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear Álbum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
