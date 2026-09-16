import type { ReactNode } from 'react'
import { Navbar } from './Navbar'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-binder-950 font-sans text-slate-100">
      {/* Luz ambiental sutil en la parte superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-900/15 via-transparent to-transparent" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="relative z-10 border-t border-binder-800/80 bg-binder-950/80 py-6 text-center text-xs text-slate-500 backdrop-blur-sm">
        <p className="font-display font-bold tracking-wider text-slate-400">
          STICKDEX • SISTEMA DE GESTIÓN PARA COLECCIONISTAS
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          Álbumes oficiales, catálogo de láminas y gestión inteligente de repetidas
        </p>
      </footer>
    </div>
  )
}
