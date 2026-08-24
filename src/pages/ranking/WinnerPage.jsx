import { useCallback, useEffect, useMemo, useState } from 'react'
import { Crown, CheckCircle2, ChevronLeft, ChevronRight, Trophy, AlertCircle, RefreshCw } from 'lucide-react'
import { rankingAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const UNIT_LABELS = { sede: 'Sede', uast: 'UAST' }
const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null)

const currentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const buildMonthOptions = (count) => {
  const now = new Date()
  const months = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export default function WinnerPage() {
  const { toast } = useToast()
  const [mes, setMes] = useState(currentMonth())
  const [rankData, setRankData] = useState(null)
  const [winner, setWinner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)

  const [year, month] = mes.split('-').map(Number)
  const monthLabel = `${MONTH_NAMES[month - 1]} de ${year}`

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [rankRes, winnerRes] = await Promise.all([
        rankingAPI.list(mes, 1, 50),
        rankingAPI.winner(mes),
      ])
      setRankData(rankRes.data)
      setWinner(winnerRes.data?.data ?? null)
    } catch {
      setError(true)
      setRankData(null)
      setWinner(null)
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => { load() }, [load])

  const changeMonth = (delta) => {
    const [y, m] = mes.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const canGoNext = mes < currentMonth()

  const monthOptions = useMemo(() => {
    const base = buildMonthOptions(12)
    return base.includes(mes) ? base : [mes, ...base].sort()
  }, [mes])

  const selectWinner = async (userCpf) => {
    setSaving(true)
    try {
      await rankingAPI.setWinner(year, month, userCpf)
      toast('Vencedor registrado com sucesso!')
      await load()
    } catch (error) {
      toast(error.response?.data?.detail?.msg || 'Erro ao registrar vencedor', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">Staff · Premiação mensal</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Vencedor do mês</h1>
          <p className="text-ru-muted mt-2">Selecione quem será o vencedor com base no ranking do mês.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="btn-secondary px-3 py-2" aria-label="Mês anterior"><ChevronLeft size={16} /></button>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="input-field w-auto py-2 text-sm"
            aria-label="Selecionar mês"
          >
            {monthOptions.map((v) => {
              const [y, m] = v.split('-').map(Number)
              return <option key={v} value={v}>{MONTH_NAMES[m - 1]} {y}</option>
            })}
          </select>
          <button onClick={() => changeMonth(1)} disabled={!canGoNext} className="btn-secondary px-3 py-2 disabled:opacity-40" aria-label="Próximo mês"><ChevronRight size={16} /></button>
        </div>
      </header>

      {winner && (
        <section className="card bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 flex items-center gap-4">
          <Trophy size={40} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-700 font-semibold">Vencedor registrado</p>
            <h2 className="font-display text-2xl font-bold text-ru-charcoal mt-1">{winner.name}</h2>
            <p className="text-sm text-ru-muted mt-0.5">{winner.confirmed_count} comparecimentos · {winner.schedule_count} agendamentos · {UNIT_LABELS[winner.academic_unit] ?? winner.academic_unit}</p>
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><Crown size={20} className="text-ru-yellow" /> Ranking de {monthLabel}</h2>

        {loading ? (
          <div className="animate-pulse h-72 rounded-xl bg-ru-cream-dark/50" aria-busy="true" />
        ) : error ? (
          <div className="text-center py-14">
            <AlertCircle size={36} className="mx-auto text-red-400" />
            <p className="font-display font-semibold text-ru-charcoal mt-4">Não foi possível carregar o ranking</p>
            <p className="text-sm text-ru-muted mt-1 mb-6">Verifique sua conexão e tente novamente.</p>
            <button onClick={load} className="btn-primary px-5 py-2.5 inline-flex items-center gap-2 text-sm"><RefreshCw size={15} /> Tentar novamente</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="responsive-table w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-ru-muted font-body border-b border-ru-cream-dark">
                  <th className="py-3 pr-3 font-semibold">#</th>
                  <th className="py-3 pr-3 font-semibold">Estudante</th>
                  <th className="py-3 pr-3 font-semibold hidden sm:table-cell">Unidade</th>
                  <th className="py-3 pr-3 font-semibold text-center">Agendamentos</th>
                  <th className="py-3 pr-3 font-semibold text-center">Comparecimentos</th>
                  <th className="py-3 font-semibold text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {!rankData?.data?.length ? (
                  <tr className="empty"><td colSpan="6" className="py-10 text-center text-ru-muted" data-label="">Nenhum dado para este mês.</td></tr>
                ) : rankData.data.map((entry) => {
                  const isWinner = winner && entry.name === winner.name
                  return (
                    <tr key={`${entry.rank}-${entry.name}`} className={`border-b border-ru-cream/60 ${isWinner ? 'bg-emerald-50' : ''}`}>
                      <td className="py-3 pr-3 font-display text-lg" data-label="Posição">{medal(entry.rank)} <span className="font-mono text-sm">{entry.rank}</span></td>
                      <td className="py-3 pr-3 text-ru-charcoal" data-label="Estudante">{entry.name}{isWinner && <CheckCircle2 size={14} className="inline text-emerald-500 ml-1" />}</td>
                      <td className="py-3 pr-3 text-ru-muted hidden sm:table-cell" data-hidden>{UNIT_LABELS[entry.academic_unit] ?? entry.academic_unit}</td>
                      <td className="py-3 pr-3 text-center font-mono" data-label="Agendamentos">{entry.schedule_count}</td>
                      <td className="py-3 pr-3 text-center font-mono font-bold text-emerald-600" data-label="Comparecimentos">{entry.confirmed_count}</td>
                      <td className="py-3 text-center" data-label="Ação">
                        <span className="cell-actions">
                          <button
                            onClick={() => selectWinner(entry.cpf || '')}
                            disabled={isWinner || saving}
                            className="text-xs btn-primary px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-40"
                          >
                            <Crown size={13} /> {isWinner ? 'Vencedor' : 'Coroa!'}
                          </button>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
