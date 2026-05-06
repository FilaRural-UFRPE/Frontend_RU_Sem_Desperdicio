import { useState, useEffect } from 'react'
import { scheduleAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import Spinner from '../../components/ui/Spinner'
import { RefreshCw, Search } from 'lucide-react'

const todayStr = new Date().toISOString().split('T')[0]

// Converte YYYY-MM-DD para DD/MM/YYYY
function toBRDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function AllSchedulesPage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(todayStr)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    const brDate = toBRDate(date)
    scheduleAPI.allSchedules(brDate)
      .then(({ data }) => {
        const raw = data?.data || []
        // Backend agora retorna objetos com name incluído
        const parsed = raw.map((s) => ({
          id: s.id,
          user_name: s.name ?? null,
          user_cpf: s.user_cpf,
          schedule_type: s.schedule_type,
          schedule_date: s.schedule_date,
          estimated_time: s.estimated_time,
          created_at: s.created_at,
        }))
        setSchedules(parsed)
      })
      .catch(() => toast('Erro ao carregar agendamentos', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [date])

  const filtered = schedules.filter((s) =>
    s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user_cpf?.includes(search)
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ru-charcoal">Agendamentos</h1>
          <p className="text-ru-muted font-body text-sm mt-1">Histórico completo do RU</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-auto text-sm py-2"
          />
          <button onClick={load} className="btn-secondary px-3 py-2">
            <RefreshCw size={15} />
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
          <p className="text-ru-muted font-body text-sm mt-1">{toBRDate(date)}</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-ru-cream-dark">
                {['Usuário', 'Refeição', 'Data', 'Horário', 'Status'].map((h) => (
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
                  <td className="px-5 py-3.5">{s.schedule_date}</td>
                  <td className="px-5 py-3.5">{s.estimated_time}</td>
                  <td className="px-5 py-3.5">
                    <span className="tag bg-blue-50 text-blue-700">Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-ru-cream/50 text-xs text-ru-muted font-body rounded-b-2xl">
            {filtered.length} registro(s) — {toBRDate(date)}
          </div>
        </div>
      )}
    </div>
  )
}