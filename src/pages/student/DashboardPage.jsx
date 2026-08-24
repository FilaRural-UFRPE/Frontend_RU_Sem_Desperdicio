import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { scheduleAPI } from '../../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar, History, User, Clock, CheckCircle, Utensils, Users,
  Sun, Sunset, Moon, UtensilsCrossed,
} from 'lucide-react'

const QUEUE_API_URL =
  import.meta.env.VITE_QUEUE_API_URL ||
  import.meta.env.VITE_VISION_API_URL ||
  'https://filarural-visao-computacional-1.onrender.com/queue/status'

const QUEUE_STATUS_MAP = {
  vazia:   { label: 'Fila pequena', color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500' },
  pequena: { label: 'Fila pequena', color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500' },
  média:   { label: 'Fila média',   color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-500' },
  grande:  { label: 'Fila grande',  color: 'text-red-700',    bg: 'bg-red-50',    dot: 'bg-red-500' },
}

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

function SkeletonBlock({ className = '' }) {
  return <div className={`bg-gray-100 rounded-2xl animate-pulse ${className}`} />
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

    fetchQueue()
    const intervalId = setInterval(fetchQueue, 5 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return <SkeletonBlock className="h-16 mb-3" />
  }

  if (!queue || !queue.available) {
    return null
  }

  const info = QUEUE_STATUS_MAP[queue.status] || QUEUE_STATUS_MAP.média

  return (
    <div className={`card ${info.bg} border-0 transition-colors duration-500 mb-3`}>
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
          <span className="text-[10px] text-ru-muted font-body">
            atualizado há {Math.round(queue.age_minutes)} min
          </span>
        )}
      </div>
    </div>
  )
}

function getGreetingIcon() {
  const hour = new Date().getHours()
  if (hour < 18) return Sun
  if (hour < 20) return Sunset
  return Moon
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scheduleAPI.mySchedules()
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
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const todayDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const GreetingIcon = getGreetingIcon()

  const isLoadingInitial = loading && upcoming.length === 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Saudação */}
      <div
        className="mb-8 opacity-0 animate-slide-up"
        style={{ animationDelay: '0ms' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <GreetingIcon size={16} className="text-ru-yellow" />
          <p className="text-ru-muted font-body text-sm capitalize">{greeting}</p>
        </div>
        <h1 className="font-display font-bold text-2xl text-ru-charcoal">
          {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-ru-muted font-body text-xs capitalize mt-0.5">{todayDate}</p>
      </div>

      {/* Fila */}
      <div
        className="opacity-0 animate-slide-up"
        style={{ animationDelay: '80ms' }}
      >
        <QueueStatusCard />
      </div>

      {/* Colaborar */}
      <Link
        to="/colaborar"
        className="card mb-6 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group border-2 hover:border-ru-blue opacity-0 animate-slide-up"
        style={{ animationDelay: '160ms' }}
      >
        <div className="w-10 h-10 bg-ru-blue/10 rounded-xl flex items-center justify-center group-hover:bg-ru-blue transition-colors">
          <Users size={18} className="text-ru-blue group-hover:text-white transition-colors" />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold text-ru-charcoal text-sm">Está na fila agora?</p>
          <p className="text-xs text-ru-muted font-body mt-0.5">
            Colabore e ajude outros estudantes a se planejarem
          </p>
        </div>
      </Link>

      {/* Grid de navegação */}
      <div
        className="grid grid-cols-2 gap-4 mb-8 opacity-0 animate-slide-up"
        style={{ animationDelay: '240ms' }}
      >
        <Link
          to="/agendar"
          className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group border-2 hover:border-ru-blue min-h-[44px]"
        >
          <div className="w-10 h-10 bg-ru-blue/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-ru-blue transition-colors">
            <Calendar size={20} className="text-ru-blue group-hover:text-white transition-colors" />
          </div>
          <p className="font-display font-semibold text-ru-charcoal">Agendar</p>
          <p className="text-xs text-ru-muted font-body mt-0.5">Almoço ou jantar</p>
        </Link>

        <Link
          to="/historico"
          className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group border-2 hover:border-ru-blue min-h-[44px]"
        >
          <div className="w-10 h-10 bg-ru-blue/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-ru-blue transition-colors">
            <History size={20} className="text-ru-blue group-hover:text-white transition-colors" />
          </div>
          <p className="font-display font-semibold text-ru-charcoal">Histórico</p>
          <p className="text-xs text-ru-muted font-body mt-0.5">Seus agendamentos</p>
        </Link>

        <Link
          to="/perfil"
          className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group border-2 hover:border-ru-blue min-h-[44px]"
        >
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

      {/* Próximas refeições */}
      <div
        className="card opacity-0 animate-slide-up"
        style={{ animationDelay: '320ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-ru-charcoal">Próximas refeições</h2>
          <Link to="/historico" className="text-xs text-ru-blue font-body hover:underline">
            Ver todos
          </Link>
        </div>

        {isLoadingInitial ? (
          <div className="flex flex-col gap-3">
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-ru-cream rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed size={22} className="text-ru-muted" />
            </div>
            <p className="font-body text-ru-muted text-sm">Nenhuma refeição agendada</p>
            <Link
              to="/agendar"
              className="inline-block mt-3 text-sm text-ru-blue font-medium hover:underline"
            >
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
