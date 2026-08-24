import { useCallback, useEffect, useState } from 'react'
import { Shuffle, Trophy, Users, AlertCircle, RefreshCw, CheckCircle2, Calendar } from 'lucide-react'
import { rankingAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

const formatDate = (value) => {
  if (!value) return '—'
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

const STATUS_LABELS = {
  open: 'Aberto',
  drawn: 'Sorteado',
  closed: 'Fechado',
}

const STATUS_COLORS = {
  open: 'bg-blue-50 text-blue-700',
  drawn: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-gray-100 text-gray-500',
}

export default function RaffleCreatePage() {
  const { toast } = useToast()
  const [raffles, setRaffles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [drawing, setDrawing] = useState(null)

  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    num_winners: 1,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await rankingAPI.raffleList()
      setRaffles(res.data.data || [])
    } catch {
      setError(true)
      setRaffles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.start_date || !form.end_date) {
      toast('Preencha todos os campos', 'error')
      return
    }
    setCreating(true)
    try {
      await rankingAPI.raffleCreate(form.name, form.start_date, form.end_date, form.num_winners)
      toast('Sorteio criado com sucesso!')
      setForm({ name: '', start_date: '', end_date: '', num_winners: 1 })
      await load()
    } catch (err) {
      toast(err.response?.data?.detail?.msg || 'Erro ao criar sorteio', 'error')
    } finally {
      setCreating(false)
    }
  }

  const draw = async (raffleId) => {
    setDrawing(raffleId)
    try {
      const res = await rankingAPI.raffleDraw(raffleId)
      const result = res.data
      toast(`Sorteio realizado! ${result.winners.length} vencedor(es) de ${result.total_participants} participantes.`)
      await load()
    } catch (err) {
      toast(err.response?.data?.detail?.msg || err.response?.data?.error || 'Erro ao sortear', 'error')
    } finally {
      setDrawing(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">Staff · Sorteios</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Gerenciar sorteios</h1>
        <p className="text-ru-muted mt-2">Crie sorteios com período configurável e sorteie vencedores aleatoriamente.</p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Shuffle size={20} className="text-ru-blue" /> Novo sorteio</h2>
        <div>
          <label className="text-sm font-body font-medium text-ru-charcoal">Nome do sorteio</label>
          <input
            className="input-field mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Sorteio de Agosto"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-body font-medium text-ru-charcoal">Data de início</label>
            <input
              type="date"
              className="input-field mt-1"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-body font-medium text-ru-charcoal">Data de fim</label>
            <input
              type="date"
              className="input-field mt-1"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-body font-medium text-ru-charcoal">Número de vencedores</label>
          <input
            type="number"
            min="1"
            max="50"
            className="input-field mt-1 w-32"
            value={form.num_winners}
            onChange={(e) => setForm({ ...form, num_winners: parseInt(e.target.value) || 1 })}
          />
        </div>
        <button type="submit" disabled={creating} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
          <Shuffle size={17} /> {creating ? 'Criando…' : 'Criar sorteio'}
        </button>
      </form>

      <section className="card">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><Trophy size={20} className="text-ru-yellow" /> Sorteios existentes</h2>

        {loading ? (
          <div className="animate-pulse h-48 rounded-xl bg-ru-cream-dark/50" />
        ) : error ? (
          <div className="text-center py-10">
            <AlertCircle size={32} className="mx-auto text-red-400" />
            <p className="font-display font-semibold text-ru-charcoal mt-3">Erro ao carregar sorteios</p>
            <button onClick={load} className="btn-primary px-4 py-2 mt-4 inline-flex items-center gap-2 text-sm"><RefreshCw size={14} /> Tentar novamente</button>
          </div>
        ) : raffles.length === 0 ? (
          <div className="text-center py-10">
            <Users size={32} className="mx-auto text-ru-muted" />
            <p className="font-display font-semibold text-ru-charcoal mt-3">Nenhum sorteio criado</p>
            <p className="text-sm text-ru-muted mt-1">Crie um sorteio acima para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {raffles.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-ru-cream-dark hover:border-ru-blue/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ru-blue/10 flex items-center justify-center">
                    <Calendar size={18} className="text-ru-blue" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-ru-charcoal">{r.name}</p>
                    <p className="text-xs text-ru-muted">
                      {formatDate(r.start_date)} — {formatDate(r.end_date)} · {r.num_winners} vencedor(es) · {r.winners_count || 0} contemplado(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`tag ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[r.status] || r.status}</span>
                  {r.status === 'open' && (
                    <button
                      onClick={() => draw(r.id)}
                      disabled={drawing === r.id}
                      className="btn-primary px-3 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <Shuffle size={15} /> {drawing === r.id ? 'Sorteando…' : 'Sortear'}
                    </button>
                  )}
                  {r.status === 'drawn' && (
                    <span className="text-emerald-500"><CheckCircle2 size={18} /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
