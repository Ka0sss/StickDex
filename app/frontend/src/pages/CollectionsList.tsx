import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { Album, Collection } from '../types'

export default function CollectionsList() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create modal
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | ''>('')
  const [isPublic, setIsPublic] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { user } = useAuth()

  const loadCollections = async () => {
    try {
      setLoading(true)
      const url =
        activeTab === 'mine' && user
          ? `/collections?userId=${user.id}`
          : '/collections?isPublic=true'
      const data = await api<Collection[]>(url)
      setCollections(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar colecciones')
    } finally {
      setLoading(false)
    }
  }

  const loadAlbums = async () => {
    try {
      const data = await api<Album[]>('/albums')
      setAlbums(data)
      if (data.length > 0) setSelectedAlbumId(data[0].id)
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadCollections()
  }, [activeTab, user])

  useEffect(() => {
    if (user) loadAlbums()
  }, [user])

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAlbumId) return
    setSubmitting(true)
    setError(null)
    try {
      await api<Collection>('/collections', {
        method: 'POST',
        body: JSON.stringify({
          name,
          albumId: Number(selectedAlbumId),
          isPublic,
        }),
      })

      setShowModal(false)
      setName('')
      setIsPublic(false)
      setActiveTab('mine')
      await loadCollections()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la colección')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Colecciones</h1>
          <p className="mt-1 text-sm text-slate-600">
            Explora las colecciones de la comunidad o gestiona las tuyas
          </p>
        </div>

        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Nueva Colección
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Públicas de la Comunidad
        </button>
        {user && (
          <button
            onClick={() => setActiveTab('mine')}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'mine'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Mis Colecciones
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Cargando colecciones...</div>
      ) : collections.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-500">
            {activeTab === 'mine'
              ? 'Aún no tienes colecciones creadas. ¡Crea una para empezar a pegar láminas!'
              : 'No hay colecciones públicas disponibles.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Link
              key={col.id}
              to={`/collections/${col.id}`}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      col.isPublic
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {col.isPublic ? 'Pública' : 'Privada'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Por: <b className="text-slate-600">{col.user?.username}</b>
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-indigo-600">
                  {col.name}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Álbum: <b className="text-slate-700">{col.album?.name}</b>
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Láminas pegadas:</span>
                  <span className="font-bold text-slate-800">
                    {col._count?.stickers || 0} / {col.album?.totalStickers || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Nueva Colección */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Iniciar Nueva Colección</h3>
            <form onSubmit={handleCreateCollection} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Nombre de la Colección
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Mi Álbum Mundial 2026"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Seleccionar Álbum
                </label>
                {albums.length === 0 ? (
                  <p className="mt-1 text-xs text-red-500">
                    No hay álbumes creados en el sistema. Primero crea un álbum.
                  </p>
                ) : (
                  <select
                    value={selectedAlbumId}
                    onChange={(e) => setSelectedAlbumId(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {albums.map((alb) => (
                      <option key={alb.id} value={alb.id}>
                        {alb.name} ({alb.totalStickers} láminas)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPublic" className="text-xs font-medium text-slate-700">
                  Colección pública (visible para otros usuarios)
                </label>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || albums.length === 0}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear Colección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
