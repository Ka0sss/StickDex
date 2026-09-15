import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { Album, Sticker } from '../types'

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const [album, setAlbum] = useState<(Album & { stickers: Sticker[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add Sticker Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [stickerNumber, setStickerNumber] = useState<number | ''>('')
  const [stickerName, setStickerName] = useState('')
  const [stickerType, setStickerType] = useState('')
  const [stickerFile, setStickerFile] = useState<File | null>(null)

  // Bulk Modal
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkInput, setBulkInput] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const loadAlbum = async () => {
    try {
      setLoading(true)
      const data = await api<Album & { stickers: Sticker[] }>(`/albums/${id}`)
      setAlbum(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar el álbum')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadAlbum()
  }, [id])

  const isOwner = user && album && album.userId === user.id

  const handleAddSticker = async (e: FormEvent) => {
    e.preventDefault()
    if (!album) return
    setSubmitting(true)
    setError(null)

    try {
      let imageUrl: string | undefined = undefined
      if (stickerFile) {
        const formData = new FormData()
        formData.append('file', stickerFile)
        const uploadRes = await api<{ imageUrl: string }>('/upload', {
          method: 'POST',
          body: formData,
        })
        imageUrl = uploadRes.imageUrl
      }

      await api<Sticker>(`/albums/${album.id}/stickers`, {
        method: 'POST',
        body: JSON.stringify({
          number: Number(stickerNumber),
          name: stickerName,
          type: stickerType || undefined,
          imageUrl,
        }),
      })

      setShowAddModal(false)
      setStickerNumber('')
      setStickerName('')
      setStickerType('')
      setStickerFile(null)
      await loadAlbum()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al agregar lámina')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!album) return
    setSubmitting(true)
    setError(null)

    try {
      const lines = bulkInput.trim().split('\n')
      const stickers: Array<{ number: number; name: string; type?: string }> = []

      for (const line of lines) {
        const parts = line.split(/[,;\t]/).map((p) => p.trim())
        if (parts.length >= 2) {
          const number = parseInt(parts[0], 10)
          const name = parts[1]
          const type = parts[2] || undefined
          if (!isNaN(number) && name) {
            stickers.push({ number, name, type })
          }
        }
      }

      if (stickers.length === 0) {
        throw new Error('Formato inválido. Usa: "1, Nombre Lámina, Tipo" por línea')
      }

      await api(`/albums/${album.id}/stickers/bulk`, {
        method: 'POST',
        body: JSON.stringify({ stickers }),
      })

      setShowBulkModal(false)
      setBulkInput('')
      await loadAlbum()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en carga masiva')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSticker = async (stickerId: number) => {
    if (!confirm('¿Eliminar esta lámina del catálogo del álbum?')) return
    try {
      await api(`/stickers/${stickerId}`, { method: 'DELETE' })
      await loadAlbum()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleDeleteAlbum = async () => {
    if (!album || !confirm(`¿Eliminar el álbum "${album.name}" y todas sus láminas?`)) return
    try {
      await api(`/albums/${album.id}`, { method: 'DELETE' })
      navigate('/albums')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar álbum')
    }
  }

  if (loading) return <div className="py-12 text-center text-slate-500">Cargando álbum...</div>
  if (!album) return <div className="py-12 text-center text-red-500">Álbum no encontrado</div>

  return (
    <div>
      <Link to="/albums" className="text-xs font-semibold text-indigo-600 hover:underline">
        ← Volver a Álbumes
      </Link>

      {/* Header del Álbum */}
      <div className="mt-4 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row">
        <div className="h-44 w-44 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {album.imageUrl ? (
            <img src={album.imageUrl} alt={album.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl font-bold text-slate-300">
              {album.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {album.stickerType || 'General'}
              </span>
              {isOwner && (
                <button
                  onClick={handleDeleteAlbum}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                >
                  Eliminar Álbum
                </button>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-black text-slate-900">{album.name}</h1>
            {album.description && <p className="mt-2 text-sm text-slate-600">{album.description}</p>}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>
              Capacidad: <b className="text-slate-700">{album.totalStickers} láminas</b>
            </span>
            <span>•</span>
            <span>
              Láminas creadas:{' '}
              <b className="text-slate-700">{album.stickers?.length || 0} de {album.totalStickers}</b>
            </span>
            {album.releaseDate && (
              <>
                <span>•</span>
                <span>Lanzamiento: {new Date(album.releaseDate).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Botones de acción si es dueño */}
      {isOwner && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
          >
            + Añadir Lámina
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            ⚡ Carga Masiva
          </button>
        </div>
      )}

      {/* Grid de Láminas del Álbum */}
      <h2 className="mt-8 text-xl font-bold text-slate-900">
        Láminas del Álbum ({album.stickers?.length || 0})
      </h2>

      {!album.stickers || album.stickers.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
          Este álbum aún no tiene láminas cargadas.
          {isOwner && ' ¡Usa "+ Añadir Lámina" o "Carga Masiva" para empezar!'}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {album.stickers.map((st) => (
            <div
              key={st.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-indigo-300"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-black text-white">
                  #{st.number}
                </span>
                {st.type && (
                  <span className="text-[10px] font-semibold text-indigo-600">{st.type}</span>
                )}
              </div>

              <div className="my-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                {st.imageUrl ? (
                  <img src={st.imageUrl} alt={st.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-300">#{st.number}</span>
                )}
              </div>

              <p className="truncate text-center text-xs font-bold text-slate-800" title={st.name}>
                {st.name}
              </p>

              {isOwner && (
                <button
                  onClick={() => handleDeleteSticker(st.id)}
                  className="mt-2 text-[10px] font-semibold text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Añadir Lámina */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Añadir Lámina al Álbum</h3>
            <form onSubmit={handleAddSticker} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold uppercase text-slate-600">Nº</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={stickerNumber}
                    onChange={(e) => setStickerNumber(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-600">Tipo</label>
                  <input
                    type="text"
                    value={stickerType}
                    onChange={(e) => setStickerType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Normal, Brillante..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">Nombre</label>
                <input
                  type="text"
                  required
                  value={stickerName}
                  onChange={(e) => setStickerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Lionel Messi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Foto de la Lámina (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setStickerFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Carga Masiva */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Carga Masiva de Láminas</h3>
            <p className="mt-1 text-xs text-slate-500">
              Ingresa una lámina por línea en formato: <code className="bg-slate-100 px-1 py-0.5 font-mono">Número, Nombre, Tipo</code>
            </p>

            <form onSubmit={handleBulkCreate} className="mt-4 space-y-4">
              <textarea
                required
                rows={8}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full font-mono rounded-lg border border-slate-300 p-3 text-xs focus:border-indigo-500 focus:outline-none"
                placeholder={`1, Escudo, Brillante\n2, Portero, Normal\n3, Capitán, Capitán`}
              />

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Cargando...' : 'Procesar Carga Masiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
