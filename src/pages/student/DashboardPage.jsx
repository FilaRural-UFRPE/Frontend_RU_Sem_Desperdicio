import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { scheduleAPI } from '../../services/api'
import { Calendar, History, User, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, mealLabel } from '../../utils/helpers'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scheduleAPI.mySchedules()
      .then(({ data }) => {
        const active = (data || [])
          .filter((s) => s.status === 'ativo')
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3)
        setUpcoming(active)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Saudação */}
      <div className="mb-8">
        <p className="text-ru-muted font-body text-sm">{greeting} 👋</p>
        <h1 className="font-display font-bold text-2xl text-ru-charcoal">
          {user?.name?.split(' ')[0]}
        </h1>
      </div>

      {/* Ações rápidas */}
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

      {/* Próximos agendamentos */}
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
                  <p className="text-sm font-body font-medium text-ru-charcoal">{mealLabel(s.meal_type)}</p>
                  <p className="text-xs text-ru-muted">{formatDate(s.date)}</p>
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
