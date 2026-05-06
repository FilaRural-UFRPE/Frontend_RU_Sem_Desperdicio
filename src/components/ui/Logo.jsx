import logoImg from '../../assets/logo.jpg'

/**
 * Componente Logo do SmartRU.
 * variant: 'full' (imagem + texto) | 'icon' (só imagem pequena) | 'img' (só imagem, tamanho configurável)
 */
export default function Logo({ variant = 'full', size = 40, className = '' }) {
  if (variant === 'icon') {
    return (
      <img
        src={logoImg}
        alt="Smart RU"
        style={{ width: size, height: size }}
        className={`object-contain rounded-xl ${className}`}
      />
    )
  }

  if (variant === 'img') {
    return (
      <img
        src={logoImg}
        alt="Smart RU"
        style={{ width: size }}
        className={`object-contain ${className}`}
      />
    )
  }

  // full: ícone + texto lado a lado
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={logoImg}
        alt="Smart RU"
        style={{ width: size, height: size }}
        className="object-contain rounded-xl"
      />
      <div>
        <p className="font-display font-bold text-ru-charcoal leading-none" style={{ fontSize: size * 0.45 }}>
          Smart RU
        </p>
        <p className="font-body text-ru-muted leading-none" style={{ fontSize: size * 0.3 }}>
          Sem Desperdício
        </p>
      </div>
    </div>
  )
}
