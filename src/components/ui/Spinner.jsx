export default function Spinner({ size = 20, className = '' }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      style={{ width: size, height: size }}
      className={`rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  )
}
