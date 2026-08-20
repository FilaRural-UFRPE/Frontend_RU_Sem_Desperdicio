import { useState, useEffect } from 'react'
import { Users, Clock, AlertCircle, Wifi } from 'lucide-react'
import Spinner from './Spinner'

const VISION_API_URL = import.meta.env.VITE_VISION_API_URL || 'https://filarural-visao-computacional-1.onrender.com'

const STATUS_CONFIG = {
  vazia:   { label: 'Vazia',   color: 'text-emerald-600', bg: 'bg-emerald-50', emoji: '🟢' },
  pequena: { label: 'Pequena', color: 'text-emerald-600', bg: 'bg-emerald-50', emoji: '🟢' },
  média:   { label: 'Média',   color: 'text-amber-600',   bg: 'bg-amber-50',   emoji: '🟡' },
  grande:  { label: 'Grande',  color: 'text-red-600',     bg: 'bg-red-50',     emoji: '🔴' },
}

export default function QueueStatusCard() {
  const [queue, setQueue] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadQueueStatus = async () => {
    try {
      const res = await fetch(`${VISION_API_URL}/queue/status`)
      const data = await res.json()
      setQueue(data)
    } catch {
      setQueue({ available: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueueStatus()
    // Atualiza a cada 3 minutos
    const interval = setInterval(loadQueueStatus, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-6">
        <Spinner size={20} className="text-ru-blue" />
      </div>
    )
  }

  if (!queue?.available) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} className="text-ru-muted" />
          <p className="font-display font-semibold text-ru-charcoal text-sm">Fila do RU</p>
        </div>
        <p className="text-xs text-ru-muted font-body">
          Estado da fila ainda não disponível.
        </p>
      </div>
    )
  }

  const config = STATUS_CONFIG[queue.status] || STATUS_CONFIG.média

  return (
    <div className={`card ${config.bg} border-0`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className={config.color} />
          <p className="font-display font-semibold text-ru-charcoal text-sm">Fila do RU agora</p>
        </div>
        {queue.is_stale && (
          <div className="flex items-center gap-1 text-amber-600" title="Dados podem estar desatualizados">
            <AlertCircle size={12} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div>
          <p className={`font-display font-bold text-2xl ${config.color}`}>
            {config.emoji} {config.label}
          </p>
          <p className="text-xs text-ru-muted font-body mt-1">
            {queue.people_in_line} {queue.people_in_line === 1 ? 'pessoa' : 'pessoas'} na fila
          </p>
        </div>

        <div className="ml-auto text-right">
          <div className="flex items-center gap-1 justify-end text-ru-charcoal">
            <Clock size={14} />
            <p className="font-display font-semibold text-sm">~{queue.waiting_time_minutes} min</p>
          </div>
          <p className="text-xs text-ru-muted font-body mt-0.5">
            {queue.age_minutes < 1 ? 'agora mesmo' : `há ${Math.round(queue.age_minutes)} min`}
          </p>
        </div>
      </div>

      {queue.is_stale && (
        <p className="text-xs text-amber-600 font-body mt-2 flex items-center gap-1">
          <Wifi size={11} />
          Câmera pode estar offline — dados desatualizados
        </p>
      )}
    </div>
  )
}
