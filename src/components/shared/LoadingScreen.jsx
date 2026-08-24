import logoImg from '../../assets/logo.jpg'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ru-cream flex flex-col items-center justify-center gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-ru-cream-dark" />
        <div className="absolute inset-0 rounded-full border-4 border-t-ru-blue animate-spin" />
        <img
          src={logoImg}
          alt="Smart RU"
          className="absolute inset-2 rounded-full object-contain"
        />
      </div>
      <p className="font-display text-ru-blue font-semibold tracking-wide">Carregando...</p>
    </div>
  )
}
