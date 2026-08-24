import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { scheduleAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { getErrorMessage, formatDate, localISODate } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import { CalendarCheck } from 'lucide-react'

const today = localISODate()

const MEAL_TYPES = [
  { value: 'select', emoji: '👑', label: 'Select', sub: 'Refeição premium' },
  { value: 'leve_sabor', emoji: '🥗', label: 'Leve Sabor', sub: 'Opção leve' },
  { value: 'essencial', emoji: '🍱', label: 'Essencial', sub: 'Refeição básica' },
  { value: 'vegetariano', emoji: '🌿', label: 'Vegetariano', sub: 'Sem carne' },
]

export default function SchedulePage() {
  const [mealType, setMealType] = useState('')
  const [mealTypeChoice, setMealTypeChoice] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mealType) { toast('Escolha almoço ou jantar', 'warning'); return }
    if (!mealTypeChoice) { toast('Escolha o tipo de refeição', 'warning'); return }
    if (!date) { toast('Escolha uma data', 'warning'); return }
    if (!time) { toast('Escolha um horário', 'warning'); return }
    setLoading(true)
    try {
      const [year, month, day] = date.split('-')
      const formattedDate = `${day}/${month}/${year}`

      await scheduleAPI.create({
        user_cpf: user.cpf,
        schedule_type: mealType,
        schedule_date: formattedDate,
        estimated_time: time,
        meal_option: mealTypeChoice, // ← atualizado de meal_type para meal_option
      })
      toast('Agendamento realizado com sucesso! ✅')
      navigate('/historico')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const mealTypeLabel = MEAL_TYPES.find(m => m.value === mealTypeChoice)?.label || ''

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-ru-charcoal">Agendar refeição</h1>
        <p className="text-ru-muted font-body text-sm mt-1">Escolha a refeição, data e horário</p>
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
        {/* Almoço ou Jantar */}
        <div>
          <p className="text-sm font-body font-medium text-ru-charcoal mb-3">Refeição</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'lunch', emoji: '🍽️', label: 'Almoço', sub: '11h – 14h' },
              { value: 'dinner', emoji: '🌙', label: 'Jantar', sub: '17h – 20h' },
            ].map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMealType(m.value)}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                  mealType === m.value
                    ? 'border-ru-blue bg-blue-50'
                    : 'border-ru-cream-dark hover:border-ru-blue/40'
                }`}
              >
                <span className="text-3xl">{m.emoji}</span>
                <div className="text-center">
                  <p className="font-display font-semibold text-ru-charcoal text-sm">{m.label}</p>
                  <p className="text-xs text-ru-muted font-body">{m.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de refeição */}
        <div>
          <p className="text-sm font-body font-medium text-ru-charcoal mb-3">Tipo de refeição</p>
          <div className="grid grid-cols-3 gap-3">
            {MEAL_TYPES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMealTypeChoice(m.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  mealTypeChoice === m.value
                    ? 'border-ru-blue bg-blue-50'
                    : 'border-ru-cream-dark hover:border-ru-blue/40'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <div className="text-center">
                  <p className="font-display font-semibold text-ru-charcoal text-xs">{m.label}</p>
                  <p className="text-xs text-ru-muted font-body">{m.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="text-sm font-body font-medium text-ru-charcoal block mb-2">Data</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
          {date && (
            <p className="text-xs text-ru-muted font-body mt-1.5">
              📅 {formatDate(date)}
            </p>
          )}
        </div>

        {/* Horário */}
        <div>
          <label className="text-sm font-body font-medium text-ru-charcoal block mb-2">
            Horário estimado
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input-field"
          />
          {mealType && (
            <p className="text-xs text-ru-muted font-body mt-1.5">
              🕐 {mealType === 'lunch' ? 'Almoço: 11h às 14h' : 'Jantar: 17h às 20h'}
            </p>
          )}
        </div>

        {/* Resumo */}
        {mealType && mealTypeChoice && date && time && (
          <div className="bg-ru-cream rounded-xl p-4 flex items-start gap-3">
            <CalendarCheck size={18} className="text-ru-blue mt-0.5" />
            <div>
              <p className="text-sm font-body font-medium text-ru-charcoal">Confirmar agendamento</p>
              <p className="text-xs text-ru-muted mt-0.5">
                {mealType === 'lunch' ? 'Almoço' : 'Jantar'} · {mealTypeLabel} · {formatDate(date)} · {time}
              </p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
          {loading ? <Spinner size={18} /> : 'Confirmar agendamento'}
        </button>
      </form>
    </div>
  )
}
