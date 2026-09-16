import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, getFieldErrors } from '../services/api'
import type { Album, Sticker } from '../types'

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const [album, setAlbum] = useState<(Album & { stickers: Sticker[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Zoom / Card Inspector Modal
  const [inspectedSticker, setInspectedSticker] = useState<Sticker | null>(null)

  // Add Sticker Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [stickerNumber, setStickerNumber] = useState<number | ''>('')
  const [stickerName, setStickerName] = useState('')
  const [stickerType, setStickerType] = useState('')
  const [stickerFile, setStickerFile] = useState<File | null>(null)
  const [stickerErrors, setStickerErrors] = useState<Record<string, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)

  // Bulk Modal
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [bulkError, setBulkError] = useState<string | null>(null)

  // Inline confirmations
  const [deletingStickerId, setDeletingStickerId] = useState<number | null>(null)
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(false)

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
    setModalError(null)
    setStickerErrors({})

    const localErrors: Record<string, string> = {}
    if (!stickerNumber || Number(stickerNumber) < 1) {
      localErrors.number = 'El número debe ser mayor a 0'
    }
    if (!stickerName.trim()) {
      localErrors.name = 'El nombre de la lámina es obligatorio'
    }

    if (Object.keys(localErrors).length > 0) {
      setStickerErrors(localErrors)
      setSubmitting(false)
      return
    }

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
          name: stickerName.trim(),
          type: stickerType.trim() || undefined,
          imageUrl,
        }),
      })

      setShowAddModal(false)
      setStickerNumber('')
      setStickerName('')
      setStickerType('')
      setStickerFile(null)
      setStickerErrors({})
      await loadAlbum()
    } catch (err: unknown) {
      const zErrors = getFieldErrors(err)
      if (Object.keys(zErrors).length > 0) {
        setStickerErrors(zErrors)
      } else {
        setModalError(err instanceof Error ? err.message : 'Error al agregar lámina')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!album) return
    setSubmitting(true)
    setBulkError(null)

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
        setBulkError('Formato inválido. Usa: "1, Nombre Lámina, Tipo" por línea')
        setSubmitting(false)
        return
      }

      await api(`/albums/${album.id}/stickers/bulk`, {
        method: 'POST',
        body: JSON.stringify({ stickers }),
      })

      setShowBulkModal(false)
      setBulkInput('')
      setBulkError(null)
      await loadAlbum()
    } catch (err: unknown) {
      setBulkError(err instanceof Error ? err.message : 'Error en carga masiva')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSticker = async (stickerId: number) => {
    try {
      await api(`/stickers/${stickerId}`, { method: 'DELETE' })
      setDeletingStickerId(null)
      await loadAlbum()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar lámina')
    }
  }

  const handleDeleteAlbum = async () => {
    if (!album) return
    try {
      await api(`/albums/${album.id}`, { method: 'DELETE' })
      navigate('/albums')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar álbum')
      setConfirmDeleteAlbum(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <p className="mt-3 text-xs font-bold tracking-wider text-slate-400">CARGANDO ÁLBUM...</p>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-bold text-red-400">Álbum no encontrado</p>
        <Link to="/albums" className="mt-4 inline-block text-xs font-bold text-amber-400 hover:underline">
          ← Volver al catálogo de álbumes
        </Link>
      </div>
    )
  }

  // Capacidad coherente corregida: nunca menor que las láminas registradas
  const totalCapacity = Math.max(album.totalStickers, album.stickers?.length || 0)
  const stickersCount = album.stickers?.length || 0
  const isCatalogComplete = stickersCount >= totalCapacity

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        to="/albums"
        className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:text-amber-400"
      >
        <span>←</span>
        <span>Volver a Catálogo de Álbumes</span>
      </Link>

      {/* Deluxe Album Presentation Banner */}
      <div className="mt-4 flex flex-col gap-6 rounded-3xl border border-binder-700/80 bg-gradient-to-br from-binder-900 via-binder-900 to-binder-950 p-6 shadow-2xl shadow-black/60 md:flex-row md:items-center">
        {/* Cover 3D Box */}
        <div className="relative aspect-[16/11] w-full flex-shrink-0 overflow-hidden rounded-2xl border border-binder-700 bg-binder-950 shadow-xl md:w-64">
          {album.imageUrl ? (
            <img src={album.imageUrl} alt={album.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-binder-800 to-binder-950 text-6xl font-black text-slate-700">
              {album.name.charAt(0)}
            </div>
          )}
          <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/75 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 backdrop-blur-md border border-amber-400/30">
            {album.stickerType || 'Fútbol'}
          </span>
        </div>

        {/* Album Meta */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center space-x-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-400/30">
                <span>🏆</span>
                <span>Edición Oficial</span>
              </span>

              {isOwner && !confirmDeleteAlbum && (
                <button
                  onClick={() => setConfirmDeleteAlbum(true)}
                  className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1 text-xs font-bold text-red-400 transition hover:bg-red-900/50 hover:text-red-200"
                >
                  Eliminar Álbum
                </button>
              )}
            </div>

            <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
              {album.name}
            </h1>
            {album.description && (
              <p className="mt-2 text-sm font-medium text-slate-300">{album.description}</p>
            )}
          </div>

          {/* Metrics & Badges (Corregido el error de texto '10 de 4') */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-binder-800/80 pt-4 text-xs">
            <div className="rounded-xl border border-binder-700 bg-binder-950/60 px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Capacidad del Álbum
              </span>
              <p className="font-mono text-base font-black text-white">{totalCapacity} láminas</p>
            </div>

            <div className="rounded-xl border border-binder-700 bg-binder-950/60 px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Láminas en Catálogo
              </span>
              <p className="font-mono text-base font-black text-amber-400">
                {stickersCount} de {totalCapacity}
              </p>
            </div>

            {isCatalogComplete && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Estado
                </span>
                <p className="text-xs font-black text-emerald-300">✓ Catálogo Completo</p>
              </div>
            )}

            {album.releaseDate && (
              <div className="rounded-xl border border-binder-700 bg-binder-950/60 px-3.5 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Lanzamiento
                </span>
                <p className="text-xs font-semibold text-slate-200">
                  {new Date(album.releaseDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de confirmación de eliminación de álbum */}
      {confirmDeleteAlbum && (
        <div className="mt-4 rounded-2xl border border-red-500/50 bg-red-950/60 p-5 shadow-xl">
          <p className="text-sm font-bold text-red-200">
            ⚠️ ¿Confirmas que deseas eliminar el álbum "{album.name}" y todas sus láminas asociadas?
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={handleDeleteAlbum}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-red-500"
            >
              Sí, eliminar álbum
            </button>
            <button
              onClick={() => setConfirmDeleteAlbum(false)}
              className="rounded-xl border border-binder-700 bg-binder-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-semibold text-red-300">
          {error}
        </div>
      )}

      {/* Barra de herramientas para el dueño */}
      {isOwner && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setModalError(null)
              setStickerErrors({})
              setShowAddModal(true)
            }}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110"
          >
            <span>+</span>
            <span>Añadir Lámina</span>
          </button>
          <button
            onClick={() => {
              setBulkError(null)
              setShowBulkModal(true)
            }}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-binder-700 bg-binder-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-binder-700"
          >
            <span>⚡</span>
            <span>Carga Masiva</span>
          </button>
        </div>
      )}

      {/* Título de sección de láminas */}
      <div className="mt-10 flex items-center justify-between border-b border-binder-800/80 pb-3">
        <div>
          <h2 className="font-display text-2xl font-black text-white">
            Colección de Láminas ({stickersCount})
          </h2>
          <p className="text-xs text-slate-400">
            Haz clic en cualquier lámina para ampliarla y ver sus detalles coleccionables
          </p>
        </div>
      </div>

      {/* Grid de Láminas - GRANDES, PROPORCIONADAS Y 100% LEGIBLES */}
      {!album.stickers || album.stickers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-binder-700/80 bg-binder-900/40 py-16 text-center">
          <p className="text-sm font-medium text-slate-400">
            Este álbum aún no tiene láminas cargadas en su catálogo.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
          {album.stickers.map((st) => (
            <div
              key={st.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-binder-700/80 bg-binder-900/90 p-3 shadow-card transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/60 hover:shadow-card-hover"
            >
              {/* Tarjeta de la Lámina en proporción 3:4 */}
              <div
                onClick={() => setInspectedSticker(st)}
                className="relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-xl bg-binder-950 shadow-inner"
              >
                {st.imageUrl ? (
                  <img
                    src={st.imageUrl}
                    alt={st.name}
                    className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                    <span className="font-mono text-3xl font-black text-slate-700">#{st.number}</span>
                    <p className="mt-2 font-display text-xs font-bold text-slate-400">{st.name}</p>
                    {st.type && (
                      <span className="mt-1 text-[10px] font-semibold text-amber-400/80">{st.type}</span>
                    )}
                  </div>
                )}

                {/* Overlay sutil al pasar cursor */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  🔍 Ver detalle
                </span>
              </div>

              {/* Pie de tarjeta: Nombre y número claramente visibles */}
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-xs font-black text-amber-400">
                  #{st.number < 10 ? `0${st.number}` : st.number}
                </span>
                <p className="truncate px-2 text-center text-xs font-extrabold text-slate-200" title={st.name}>
                  {st.name}
                </p>
                {st.type ? (
                  <span className="rounded bg-binder-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                    {st.type}
                  </span>
                ) : <span />}
              </div>

              {/* Botón de borrado para el dueño */}
              {isOwner && (
                <div className="mt-2 border-t border-binder-800/80 pt-2 text-center">
                  {deletingStickerId === st.id ? (
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="text-[10px] font-bold text-red-400">¿Borrar?</span>
                      <button
                        onClick={() => handleDeleteSticker(st.id)}
                        className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-500"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setDeletingStickerId(null)}
                        className="rounded bg-binder-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:bg-binder-700"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingStickerId(st.id)}
                      className="text-[10px] font-bold text-slate-500 transition hover:text-red-400 hover:underline"
                    >
                      Eliminar lámina
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Card Inspector Lightbox (AMPLIACIÓN EN ALTA RESOLUCIÓN) */}
      {inspectedSticker && (
        <div
          onClick={() => setInspectedSticker(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-md flex-col items-center rounded-3xl border border-amber-400/40 bg-binder-900 p-6 shadow-foil"
          >
            <button
              onClick={() => setInspectedSticker(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-binder-800 text-sm font-bold text-slate-300 hover:bg-binder-700 hover:text-white"
            >
              ✕
            </button>

            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              INSPECTOR DE LÁMINA COLECCIONABLE
            </span>

            {/* Imagen grande en ratio 3:4 */}
            <div className="mt-4 aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-binder-950 shadow-2xl">
              {inspectedSticker.imageUrl ? (
                <img
                  src={inspectedSticker.imageUrl}
                  alt={inspectedSticker.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <span className="font-mono text-6xl font-black text-slate-700">
                    #{inspectedSticker.number}
                  </span>
                  <p className="mt-3 font-display text-lg font-bold text-white">
                    {inspectedSticker.name}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <h3 className="font-display text-2xl font-black text-white">
                #{inspectedSticker.number} — {inspectedSticker.name}
              </h3>
              {inspectedSticker.type && (
                <span className="mt-2 inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/40">
                  {inspectedSticker.type}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Lámina */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-binder-700 bg-binder-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-binder-800 pb-3">
              <h3 className="font-display text-xl font-black text-white">Añadir Lámina al Álbum</h3>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form noValidate onSubmit={handleAddSticker} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Nº
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={stickerNumber}
                    onChange={(e) => {
                      setStickerNumber(e.target.value === '' ? '' : Number(e.target.value))
                      if (stickerErrors.number) setStickerErrors((prev) => ({ ...prev, number: '' }))
                    }}
                    className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none ${
                      stickerErrors.number
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-binder-700 focus:border-amber-400'
                    }`}
                    placeholder="1"
                  />
                  {stickerErrors.number && (
                    <p className="mt-1 text-xs font-semibold text-red-400">{stickerErrors.number}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Tipo / Rol
                  </label>
                  <input
                    type="text"
                    value={stickerType}
                    onChange={(e) => setStickerType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-binder-700 bg-binder-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    placeholder="Brillante, Capitán..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Nombre del Jugador / Elemento
                </label>
                <input
                  type="text"
                  value={stickerName}
                  onChange={(e) => {
                    setStickerName(e.target.value)
                    if (stickerErrors.name) setStickerErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    stickerErrors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-binder-700 focus:border-amber-400'
                  }`}
                  placeholder="Lionel Messi"
                />
                {stickerErrors.name && (
                  <p className="mt-1 text-xs font-semibold text-red-400">{stickerErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Foto de la Lámina (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setStickerFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-binder-800 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-amber-400 hover:file:bg-binder-700"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3 border-t border-binder-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-binder-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Añadir Lámina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Carga Masiva */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-binder-700 bg-binder-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-binder-800 pb-3">
              <h3 className="font-display text-xl font-black text-white">Carga Masiva de Láminas</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs font-medium text-slate-400">
              Ingresa una lámina por línea en formato:{' '}
              <code className="rounded bg-binder-950 px-1.5 py-0.5 font-mono text-amber-300">
                Número, Nombre, Tipo
              </code>
            </p>

            {bulkError && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
                {bulkError}
              </div>
            )}

            <form noValidate onSubmit={handleBulkCreate} className="mt-4 space-y-4">
              <textarea
                rows={7}
                value={bulkInput}
                onChange={(e) => {
                  setBulkInput(e.target.value)
                  if (bulkError) setBulkError(null)
                }}
                className={`w-full rounded-xl border bg-binder-950 p-3 font-mono text-xs text-white placeholder-slate-600 focus:outline-none ${
                  bulkError ? 'border-red-500' : 'border-binder-700 focus:border-amber-400'
                }`}
                placeholder={`1, Escudo FIFA, Brillante\n2, Lionel Messi, Capitán\n3, Kylian Mbappé, Delantero`}
              />

              <div className="flex justify-end space-x-3 border-t border-binder-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-xl border border-binder-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Procesando...' : 'Cargar Láminas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
