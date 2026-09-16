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
  const [totalStickers, setTotalStickers] = useState<number | ''>(100)
  const [releaseDate, setReleaseDate] = useState('')
  const [stickerType, setStickerType] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
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
    setError(null)
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
        setError(err instanceof Error ? err.message : 'Error al crear álbum')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Catálogo de Álbumes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Explora los álbumes disponibles para coleccionar
          </p>
        </div>
        {user && (
          <button
            onClick={() => {
              setFieldErrors({})
              setError(null)
              setShowModal(true)
            }}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Crear Álbum
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Cargando álbumes...</div>
      ) : albums.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-500">No hay álbumes creados todavía.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              to={`/albums/${album.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="h-48 w-full bg-slate-100 object-cover">
                {album.imageUrl ? (
                  <img
                    src={album.imageUrl}
                    alt={album.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-bold text-slate-300">
                    {album.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {album.stickerType || 'General'}
                  </span>
                  <span className="text-xs text-slate-500">{album.totalStickers} láminas</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-indigo-600">
                  {album.name}
                </h3>
                {album.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{album.description}</p>
                )}
                {album.releaseDate && (
                  <p className="mt-auto pt-3 text-[11px] text-slate-400">
                    Lanzamiento: {new Date(album.releaseDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal crear álbum */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Álbum</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form noValidate onSubmit={handleCreateAlbum} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                    fieldErrors.name
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                  placeholder="Mundial 2026"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
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
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                      fieldErrors.totalStickers
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                  />
                  {fieldErrors.totalStickers && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.totalStickers}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Tipo de Láminas
                  </label>
                  <input
                    type="text"
                    value={stickerType}
                    onChange={(e) => setStickerType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Fútbol, Pokémon..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Fecha de Lanzamiento
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Foto de portada (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Crear Álbum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
