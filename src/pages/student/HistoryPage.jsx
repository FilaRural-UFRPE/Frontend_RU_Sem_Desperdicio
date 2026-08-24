import { useState, useEffect } from 'react'
import { scheduleAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getErrorMessage, MEAL_TYPE_LABELS } from '../../utils/helpers'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import { RefreshCw, X } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

const MEAL_TYPES = [
  { value: 'select', emoji: '👑', label: 'Select' },
  { value: 'leve_sabor', emoji: '🥗', label: 'Leve Sabor' },
  { value: 'essencial', emoji: '🍱', label: 'Essencial' },
  { value: 'vegetariano', emoji: '🌿', label: 'Vegetariano' },
]

export default function HistoryPage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(null)
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newMealOption, setNewMealOption] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const load = () => {
    setLoading(true)
    scheduleAPI.mySchedules()
      .then(({ data }) => {
        const raw = data?.data || []
        const parsed = raw.map((s) => ({
          id: s.id,
          schedule_type: s.schedule_type,
          meal_option: s.meal_option || 'essencial', // ← atualizado
          schedule_date: s.schedule_date,
          estimated_time: s.estimated_time,
          created_at: s.created_at,
        }))
        setSchedules(parsed)
      })
      .catch(() => toast('Erro ao carregar agendamentos', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const toBackendDate = (dateStr) => {
    const clean = dateStr?.split('T')[0]
    const [year, month, day] = clean.split('-')
    return `${day}/${month}/${year}`
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      await scheduleAPI.cancel({
        user_cpf: user.cpf,
        schedule_type: cancelModal.schedule_type,
        schedule_date: toBackendDate(cancelModal.schedule_date),
      })
      toast('Agendamento cancelado.')
      setCancelModal(null)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!newDate) { toast('Escolha uma nova data', 'warning'); return }
    if (!newTime) { toast('Escolha um novo horário', 'warning'); return }
    if (!newMealOption) { toast('Escolha o tipo de refeição', 'warning'); return }
    setActionLoading(true)
    try {
      await scheduleAPI.update({
        id: rescheduleModal.id,
        user_cpf: user.cpf,
        schedule_type: rescheduleModal.schedule_type,
        schedule_date: toBackendDate(newDate),
        estimated_time: newTime,
        meal_option: newMealOption, // ← atualizado
      })
      toast('Reagendado com sucesso! ✅')
      setRescheduleModal(null)
      setNewDate('')
      setNewTime('')
      setNewMealOption('')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const mealLabel = (type) => type === 'lunch' ? '🍽️ Almoço' : '🌙 Jantar'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ru-charcoal">Histórico</h1>
          <p className="text-ru-muted font-body text-sm mt-1">Todos os seus agendamentos</p>
        </div>
        <button onClick={load} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} className="text-ru-blue" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-display font-semibold text-ru-charcoal">Nenhum agendamento ainda</p>
          <p className="text-ru-muted font-body text-sm mt-1">Seus agendamentos aparecerão aqui</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {schedules.map((s) => (
            <div key={s.id} className="card flex items-center gap-4">
              <div className="w-11 h-11 bg-ru-cream rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {s.schedule_type === 'lunch' ? '🍽️' : '🌙'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-ru-charcoal text-sm">
                  {mealLabel(s.schedule_type)}
                </p>
                <p className="text-xs text-ru-muted font-body mt-0.5">
                  {MEAL_TYPE_LABELS[s.meal_option] || s.meal_option}
                </p>
                <p className="text-xs text-ru-muted font-body mt-0.5">
                  📅 {s.schedule_date?.split('T')[0]} · 🕐 {s.estimated_time?.slice(0, 5)}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setRescheduleModal(s); setNewDate(''); setNewTime(''); setNewMealOption(s.meal_option || '') }}
                  className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                  title="Reagendar"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={() => setCancelModal(s)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  title="Cancelar"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal cancelar */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancelar agendamento">
        <p className="font-body text-ru-charcoal text-sm mb-6">
          Tem certeza que deseja cancelar o{' '}
          <strong>{cancelModal?.schedule_type === 'lunch' ? 'almoço' : 'jantar'}</strong> do dia{' '}
          <strong>{cancelModal?.schedule_date?.split('T')[0]}</strong>?
        </p>
        <div className="flex gap-3">
          <button onClick={() => setCancelModal(null)} className="btn-secondary flex-1">Voltar</button>
          <button onClick={handleCancel} disabled={actionLoading} className="btn-danger flex-1 flex items-center justify-center gap-2">
            {actionLoading ? <Spinner size={16} /> : 'Cancelar'}
          </button>
        </div>
      </Modal>

      {/* Modal reagendar */}
      <Modal open={!!rescheduleModal} onClose={() => setRescheduleModal(null)} title="Reagendar refeição">
        <p className="text-sm font-body text-ru-muted mb-4">
          Escolha nova data, horário e tipo para o{' '}
          <strong className="text-ru-charcoal">
            {rescheduleModal?.schedule_type === 'lunch' ? 'almoço' : 'jantar'}
          </strong>
        </p>
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-sm font-body font-medium text-ru-charcoal block mb-2">Nova data</label>
            <input type="date" value={newDate} min={today} onChange={(e) => setNewDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-body font-medium text-ru-charcoal block mb-2">Novo horário</label>
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-body font-medium text-ru-charcoal block mb-2">Tipo de refeição</label>
            <div className="grid grid-cols-3 gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setNewMealOption(m.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    newMealOption === m.value
                      ? 'border-ru-blue bg-blue-50'
                      : 'border-ru-cream-dark hover:border-ru-blue/40'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <p className="font-display font-semibold text-ru-charcoal text-xs">{m.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setRescheduleModal(null)} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleReschedule} disabled={actionLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {actionLoading ? <Spinner size={16} /> : 'Confirmar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
