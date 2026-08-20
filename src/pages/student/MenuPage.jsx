import { useState, useEffect, useCallback } from 'react'
import { menuAPI } from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import { RefreshCw, UtensilsCrossed, AlertCircle, WifiOff } from 'lucide-react'

function formatDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export default function MenuPage() {
  const [menu, setMenu] = useState(null)
  const [lunchSrc, setLunchSrc] = useState(null)
  const [dinnerSrc, setDinnerSrc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // 'not_found' | 'network' | null

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setMenu(null)
    setLunchSrc(null)
    setDinnerSrc(null)

    menuAPI.current()
      .then(({ data }) => {
        const menuData = data.data
        setMenu(menuData)

        const images = menuData.images || {}
        const hasLunch = !!images.lunch?.image_url
        const hasDinner = !!images.dinner?.image_url

        const promises = []

        if (hasLunch) {
          promises.push(
            menuAPI.image(menuData.id, 'lunch')
              .then((res) => setLunchSrc(URL.createObjectURL(res.data)))
              .catch(() => {})
          )
        }

        if (hasDinner) {
          promises.push(
            menuAPI.image(menuData.id, 'dinner')
              .then((res) => setDinnerSrc(URL.createObjectURL(res.data)))
              .catch(() => {})
          )
        }

        return Promise.all(promises)
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('not_found')
        } else {
          setError('network')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ru-charcoal">Cardápio da Semana</h1>
          <p className="text-ru-muted font-body text-sm mt-1">
            Confira as refeições disponíveis esta semana
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Atualizar cardápio
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner size={28} className="text-ru-blue" />
          <p className="text-ru-muted font-body text-sm">Carregando cardápio...</p>
        </div>
      )}

      {/* Sem cardápio (404) */}
      {!loading && error === 'not_found' && (
        <div className="card text-center py-16">
          <UtensilsCrossed size={48} className="mx-auto text-ru-muted mb-4 opacity-40" />
          <p className="font-display font-semibold text-ru-charcoal text-lg">
            Ainda não há cardápio disponível
          </p>
          <p className="text-ru-muted font-body text-sm mt-2">
            O cardápio ainda não foi publicado. Tente novamente mais tarde.
          </p>
        </div>
      )}

      {/* Erro de rede */}
      {!loading && error === 'network' && (
        <div className="card text-center py-16">
          <WifiOff size={48} className="mx-auto text-ru-muted mb-4 opacity-40" />
          <p className="font-display font-semibold text-ru-charcoal text-lg">
            Não foi possível carregar o cardápio
          </p>
          <p className="text-ru-muted font-body text-sm mt-2 mb-6">
            Verifique sua conexão com a internet e tente novamente.
          </p>
          <button
            onClick={load}
            className="btn-primary px-6 py-2 text-sm mx-auto flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Cardápio disponível */}
      {!loading && !error && menu && (
        <div className="flex flex-col gap-6">
          {/* Almoço */}
          {lunchSrc && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-ru-blue/5 border-b border-ru-cream-dark">
                <p className="font-display font-semibold text-ru-blue text-sm">🍽 Almoço</p>
              </div>
              <img
                src={lunchSrc}
                alt="Cardápio do almoço"
                className="w-full object-contain max-h-[70vh]"
                onError={() => setLunchSrc(null)}
              />
              <div className="px-5 py-3 bg-ru-cream/50 flex items-center gap-2 text-xs text-ru-muted font-body">
                <AlertCircle size={12} />
                Atualizado em: {formatDate(menu.uploaded_at)}
              </div>
            </div>
          )}

          {/* Jantar */}
          {dinnerSrc && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-ru-blue/5 border-b border-ru-cream-dark">
                <p className="font-display font-semibold text-ru-blue text-sm">🌙 Jantar</p>
              </div>
              <img
                src={dinnerSrc}
                alt="Cardápio do jantar"
                className="w-full object-contain max-h-[70vh]"
                onError={() => setDinnerSrc(null)}
              />
              <div className="px-5 py-3 bg-ru-cream/50 flex items-center gap-2 text-xs text-ru-muted font-body">
                <AlertCircle size={12} />
                Atualizado em: {formatDate(menu.uploaded_at)}
              </div>
            </div>
          )}

          {/* Nenhuma imagem carregou */}
          {!lunchSrc && !dinnerSrc && (
            <div className="card text-center py-16">
              <UtensilsCrossed size={48} className="mx-auto text-ru-muted mb-4 opacity-40" />
              <p className="font-display font-semibold text-ru-charcoal text-lg">
                Ainda não há cardápio disponível
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
