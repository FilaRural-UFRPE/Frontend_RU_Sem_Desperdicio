import { useState, useEffect } from 'react'
import { scheduleAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import Spinner from '../../components/ui/Spinner'
import { RefreshCw, Search, CheckCircle } from 'lucide-react'
import { toBRDate, MEAL_TYPE_LABELS } from '../../utils/helpers'

const todayStr = new Date().toISOString().split('T')[0]

export default function AllSchedulesPage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(todayStr)
  const [search, setSearch] = useState('')
  const [showingAll, setShowingAll] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const { toast } = useToast()

  const load = (filterDate = null) => {
    setLoading(true)
    setShowingAll(!filterDate)
    scheduleAPI.allSchedules(filterDate)
      .then(({ data }) => {
        const raw = data?.data || []
        const parsed = raw.map((s) => ({
          id: s.id,
          user_name: s.name ?? null,
          user_cpf: s.user_cpf,
          schedule_type: s.schedule_type,
          meal_option: s.meal_option || s.meal_type || 'essencial',
          schedule_date: s.schedule_date,
          estimated_time: s.estimated_time,
          status: s.status || 'AGENDADO',
          created_at: s.created_at,
        }))
        setSchedules(parsed)
      })
      .catch(() => toast('Erro ao carregar agendamentos', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(toBRDate(todayStr)) }, [])

  const handleDateChange = (e) => {
    const newDate = e.target.value
    setDate(newDate)
    load(toBRDate(newDate))
  }

  const handleConfirm = async (id) => {
    setConfirming(id)
    try {
      await scheduleAPI.confirm({ id })
      toast('Presença confirmada! ✅')
      setSchedules((prev) =>
        prev.map((s) => s.id === id ? { ...s, status: 'CONFIRMADO' } : s)
      )
    } catch {
      toast('Erro ao confirmar presença', 'error')
    } finally {
      setConfirming(null)
    }
  }

  const filtered = schedules.filter((s) => {
    const cleanSearch = search.replace(/\D/g, '')
    return (
      s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user_cpf?.includes(cleanSearch || search)
    )
  })

  const statusBadge = (status) => {
    if (status === 'CONFIRMADO') return <span className="tag bg-green-50 text-green-700">✅ Confirmado</span>
    if (status === 'CANCELADO') return <span className="tag bg-red-50 text-red-600">❌ Cancelado</span>
    return <span className="tag bg-blue-50 text-blue-700">📋 Agendado</span>
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ru-charcoal">Agendamentos</h1>
          <p className="text-ru-muted font-body text-sm mt-1">
            {showingAll ? 'Todos os agendamentos' : `Agendamentos de ${toBRDate(date)}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="input-field w-auto text-sm py-2"
          />
          <button
            onClick={() => load(toBRDate(date))}
            className="btn-secondary px-3 py-2"
            title="Filtrar por data"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => load(null)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Ver todos
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ru-muted" />
        <input
          type="text"
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} className="text-ru-blue" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-display font-semibold text-ru-charcoal">Nenhum agendamento encontrado</p>
          <p className="text-ru-muted font-body text-sm mt-1">
            {showingAll ? 'Sem agendamentos no sistema' : toBRDate(date)}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-ru-cream-dark">
                {['Usuário', 'Refeição', 'Tipo', 'Data', 'Horário', 'Status', 'Ação'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-ru-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-ru-cream-dark last:border-0 hover:bg-ru-cream/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ru-charcoal">{s.user_name ?? s.user_cpf}</p>
                    <p className="text-xs text-ru-muted">{s.user_name ? s.user_cpf : 'CPF'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {s.schedule_type === 'lunch' ? '🍽️ Almoço' : '🌙 Jantar'}
                  </td>
                  <td className="px-5 py-3.5">
                    {MEAL_TYPE_LABELS[s.meal_option] || s.meal_option}
                  </td>
                  <td className="px-5 py-3.5">{s.schedule_date?.split('T')[0]}</td>
                  <td className="px-5 py-3.5">{s.estimated_time?.slice(0, 5)}</td>
                  <td className="px-5 py-3.5">{statusBadge(s.status)}</td>
                  <td className="px-5 py-3.5">
                    {s.status === 'AGENDADO' ? (
                      <button
                        onClick={() => handleConfirm(s.id)}
                        disabled={confirming === s.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        {confirming === s.id
                          ? <Spinner size={12} />
                          : <CheckCircle size={13} />
                        }
                        Confirmar
                      </button>
                    ) : (
                      <span className="text-xs text-ru-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-ru-cream/50 text-xs text-ru-muted font-body rounded-b-2xl">
            {filtered.length} registro(s) — {showingAll ? 'todos' : toBRDate(date)}
          </div>
        </div>
      )}
    </div>
  )
}
