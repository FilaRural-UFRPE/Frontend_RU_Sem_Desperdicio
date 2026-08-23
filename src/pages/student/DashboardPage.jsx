import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { scheduleAPI } from '../../services/api'
import { Calendar, History, User, Clock, CheckCircle, Utensils } from 'lucide-react'

// Prioriza o filarural-backend (colaborativo + visao com fallback).
// Enquanto o backend nao estiver no ar, cai direto na visao computacional.
const QUEUE_API_URL =
  import.meta.env.VITE_QUEUE_API_URL ||
  import.meta.env.VITE_VISION_API_URL ||
  'https://filarural-visao-computacional-1.onrender.com/queue/status'

// Mapeia o status textual da API para cor e rótulo amigável.
// Propositalmente NÃO exibimos o número de pessoas na fila — só o nível.
const QUEUE_STATUS_MAP = {
  vazia:  { label: 'Fila pequena', color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500' },
  pequena:{ label: 'Fila pequena', color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500' },
  média:  { label: 'Fila média',   color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-500' },
  grande: { label: 'Fila grande',  color: 'text-red-700',    bg: 'bg-red-50',    dot: 'bg-red-500' },
}

// Normaliza a resposta, aceitando tanto o formato da visao computacional
// (status, waiting_time_minutes, available, is_stale, age_minutes)
// quanto o formato do filarural-backend (queue_state, estimated_wait_minutes,
// origin, updated_at) — assim o componente funciona nos dois sem trocar codigo.
function normalizeQueueData(data) {
  if (!data) return null

  const status = data.queue_state ?? data.status
  const waitingTimeMinutes = data.estimated_wait_minutes ?? data.waiting_time_minutes ?? 0

  const available =
    typeof data.available === 'boolean'
      ? data.available
      : Boolean(data.origin) && data.origin !== 'indisponivel'

  let ageMinutes = typeof data.age_minutes === 'number' ? data.age_minutes : null
  if (ageMinutes === null && data.updated_at) {
    const updated = new Date(data.updated_at).getTime()
    if (!Number.isNaN(updated)) {
      ageMinutes = (Date.now() - updated) / 60000
    }
  }

  const isStale =
    typeof data.is_stale === 'boolean'
      ? data.is_stale
      : ageMinutes !== null && ageMinutes > 10

  return { status, waiting_time_minutes: waitingTimeMinutes, available, is_stale: isStale, age_minutes: ageMinutes }
}

function QueueStatusCard() {
  const [queue, setQueue] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQueue = () => {
      fetch(QUEUE_API_URL)
        .then((res) => res.json())
        .then((data) => setQueue(normalizeQueueData(data)))
        .catch(() => setQueue(null))
        .finally(() => setLoading(false))
    }

    fetchQueue() // busca imediatamente ao carregar a tela

    // Atualiza a cada 5 minutos — mesmo intervalo do capture_and_analyze.py
    const intervalId = setInterval(fetchQueue, 5 * 60 * 1000)

    return () => clearInterval(intervalId) // limpa o intervalo ao sair da tela
  }, [])

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-4 mb-6">
        <div className="w-5 h-5 border-2 border-ru-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!queue || !queue.available) {
    return null // sem dado recente disponível — não mostra nada em vez de informação errada
  }

  const info = QUEUE_STATUS_MAP[queue.status] || QUEUE_STATUS_MAP.média

  return (
    <div className={`card ${info.bg} border-2 border-transparent mb-6`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
          <Utensils size={18} className={info.color} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${info.dot}`} />
            <p className={`font-display font-semibold ${info.color}`}>{info.label}</p>
          </div>
          <p className="text-xs text-ru-muted font-body mt-0.5">
            ~{queue.waiting_time_minutes} min de espera estimada
          </p>
        </div>
        {queue.is_stale && queue.age_minutes !== null && (
          <span className="text-[10px] text-ru-muted font-body">atualizado há {Math.round(queue.age_minutes)} min</span>
        )}
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.cpf) return
    scheduleAPI.mySchedules(user.cpf)
      .then(({ data }) => {
        const raw = data?.data || []
        const parsed = raw.map(([id, schedule_type, schedule_date, estimated_time]) => ({
          id,
          schedule_type,
          schedule_date,
          estimated_time,
        }))
        setUpcoming(parsed.slice(0, 3))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-ru-muted font-body text-sm">{greeting} 👋</p>
        <h1 className="font-display font-bold text-2xl text-ru-charcoal">
          {user?.name?.split(' ')[0]}
        </h1>
      </div>

      <QueueStatusCard />

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link to="/agendar" className="card hover:shadow-md transition-shadow cursor-pointer group border-2 hover:border-ru-blue">
          <div className="w-10 h-10 bg-ru-blue/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-ru-blue transition-colors">
            <Calendar size={20} className="text-ru-blue group-hover:text-white transition-colors" />
          </div>
          <p className="font-display font-semibold text-ru-charcoal">Agendar</p>
          <p className="text-xs text-ru-muted font-body mt-0.5">Almoço ou jantar</p>
        </Link>

        <Link to="/historico" className="card hover:shadow-md transition-shadow cursor-pointer group border-2 hover:border-ru-blue">
          <div className="w-10 h-10 bg-ru-blue/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-ru-blue transition-colors">
            <History size={20} className="text-ru-blue group-hover:text-white transition-colors" />
          </div>
          <p className="font-display font-semibold text-ru-charcoal">Histórico</p>
          <p className="text-xs text-ru-muted font-body mt-0.5">Seus agendamentos</p>
        </Link>

        <Link to="/perfil" className="card hover:shadow-md transition-shadow cursor-pointer group border-2 hover:border-ru-blue">
          <div className="w-10 h-10 bg-ru-blue/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-ru-blue transition-colors">
            <User size={20} className="text-ru-blue group-hover:text-white transition-colors" />
          </div>
          <p className="font-display font-semibold text-ru-charcoal">Perfil</p>
          <p className="text-xs text-ru-muted font-body mt-0.5">Seus dados</p>
        </Link>

        <div className="card bg-ru-blue border-2 border-ru-blue">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <span className="text-xl">🍃</span>
          </div>
          <p className="font-display font-semibold text-white">SmartRU</p>
          <p className="text-xs text-white/70 font-body mt-0.5">Reduzindo desperdício</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-ru-charcoal">Próximas refeições</h2>
          <Link to="/historico" className="text-xs text-ru-blue font-body hover:underline">Ver todos</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-ru-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-body text-ru-muted text-sm">Nenhum agendamento ativo</p>
            <Link to="/agendar" className="inline-block mt-3 text-sm text-ru-blue font-medium hover:underline">
              Agendar agora →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-ru-cream rounded-xl">
                <div className="w-9 h-9 bg-ru-blue/10 rounded-lg flex items-center justify-center">
                  <Clock size={15} className="text-ru-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-body font-medium text-ru-charcoal">
                    {s.schedule_type === 'lunch' ? '🍽️ Almoço' : '🌙 Jantar'}
                  </p>
                  <p className="text-xs text-ru-muted">{s.schedule_date} · {s.estimated_time}</p>
                </div>
                <CheckCircle size={16} className="text-blue-700" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
