interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function StickDexLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Isotipo: Lámina coleccionable hexagonal con esquina despegada en 3D y brillo holográfico */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
        >
          <defs>
            {/* Gradiente de lámina física */}
            <linearGradient id="stickerBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="45%" stop-color="#1d4ed8" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>

            {/* Gradiente dorado / holográfico del reverso despegado */}
            <linearGradient id="foilPeel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a" />
              <stop offset="40%" stop-color="#f59e0b" />
              <stop offset="100%" stop-color="#b45309" />
            </linearGradient>

            {/* Borde metálico */}
            <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#fbbf24" />
              <stop offset="50%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#d97706" />
            </linearGradient>

            {/* Sombra de la esquina despegada */}
            <filter id="peelShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="-1.5" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.6" />
            </filter>
          </defs>

          {/* Cuerpo de la lámina (Cromo troquelado con esquina superior derecha doblada) */}
          <path
            d="M 8 6 
               L 32 6 
               L 42 16 
               L 42 42 
               C 42 44, 40 46, 38 46 
               L 8 46 
               C 6 46, 4 44, 4 42 
               L 4 10 
               C 4 8, 6 6, 8 6 Z"
            fill="url(#stickerBody)"
            stroke="url(#goldBorder)"
            stroke-width="1.8"
          />

          {/* Patrón de líneas internas de cromo */}
          <path
            d="M 10 12 L 28 12 M 10 18 L 24 18 M 10 24 L 36 24 M 10 30 L 36 30 M 10 36 L 36 36"
            stroke="#60a5fa"
            stroke-opacity="0.25"
            stroke-width="1.2"
            stroke-linecap="round"
          />

          {/* Letra emblemática 'S' estilizada en el corazón de la lámina */}
          <path
            d="M 28 20 
               C 28 16, 17 16, 17 22 
               C 17 28, 29 27, 29 34 
               C 29 40, 16 40, 15 35"
            stroke="url(#foilPeel)"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          {/* Esquina despegada en 3D (Peel Effect) */}
          <path
            d="M 32 6 
               L 42 16 
               L 34 16 
               C 33 16, 32 15, 32 14 Z"
            fill="url(#foilPeel)"
            filter="url(#peelShadow)"
            stroke="#fde68a"
            stroke-width="1"
          />
        </svg>
      </div>

      {/* Wordmark personalizado */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline space-x-1">
            <span className={`font-display font-black tracking-tighter text-white ${textSizes[size]}`}>
              STICK
            </span>
            <span className={`font-display font-black tracking-tight text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)] ${textSizes[size]}`}>
              DEX
            </span>
          </div>
          <span className="text-[9px] font-mono font-black uppercase tracking-[0.25em] text-slate-400">
            ALBUM VAULT
          </span>
        </div>
      )}
    </div>
  )
}
