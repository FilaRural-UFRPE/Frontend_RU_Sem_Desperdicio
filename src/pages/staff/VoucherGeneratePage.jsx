import { useEffect, useState } from 'react'
import { Gift, Trophy, Users, Crown, AlertCircle, RefreshCw } from 'lucide-react'
import { voucherAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

const UNIT_LABELS = { sede: 'Sede', uast: 'UAST' }

export default function VoucherGeneratePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [winners, setWinners] = useState([])
  const [generating, setGenerating] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await voucherAPI.availableWinners()
      setWinners(response.data.data || [])
    } catch {
      setError(true)
      setWinners([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const generate = async (w) => {
    if (!w?.user_cpf) return
    const confirmed = window.confirm(
      `Gerar o voucher mensal para ${w.name} (CPF ${w.user_cpf})?\n\nCada vencedor tem direito a um único voucher. Esta ação não poderá ser desfeita.`
    )
    if (!confirmed) return
    setGenerating(w.user_cpf)
    try {
      const { data: result } = await voucherAPI.generate(w.user_cpf)
      if (!result.success) {
        toast(result.msg || 'Não foi possível gerar o voucher', 'error')
        return
      }
      toast('Voucher gerado com sucesso!')
      await load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Não foi possível gerar o voucher', 'error')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">
          Premiação mensal · Geração de vouchers
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Gerar voucher</h1>
        <p className="text-ru-muted mt-2">
          Selecione o vencedor do mês e gere o voucher de premiação.
        </p>
      </header>

      <section className="card">
        <div className="flex items-center gap-2 text-sm mb-4">
          <Trophy size={18} className="text-ru-yellow" />
          <span className="font-display font-semibold">Vencedores com prêmio disponível</span>
        </div>

        {loading ? (
          <div className="animate-pulse h-48 rounded-xl bg-ru-cream-dark/50" />
        ) : error ? (
          <div className="text-center py-10">
            <AlertCircle size={32} className="mx-auto text-red-400" />
            <p className="font-display font-semibold text-ru-charcoal mt-3">
              Erro ao carregar vencedores
            </p>
            <button
              onClick={load}
              className="btn-primary px-4 py-2 mt-4 inline-flex items-center gap-2 text-sm"
            >
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        ) : winners.length === 0 ? (
          <div className="text-center py-10">
            <Users size={32} className="mx-auto text-ru-muted" />
            <p className="font-display font-semibold text-ru-charcoal mt-3">
              Nenhum prêmio pendente
            </p>
            <p className="text-sm text-ru-muted mt-1">
              Todos os vencedores já tiveram seus vouchers gerados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {winners.map((w) => (
              <div
                key={w.user_cpf}
                className="flex items-center justify-between p-4 rounded-xl border border-ru-cream-dark hover:border-ru-blue/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ru-blue/10 flex items-center justify-center">
                    <Crown size={18} className="text-ru-yellow" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-ru-charcoal">{w.name}</p>
                    <p className="text-xs text-ru-muted">
                      {w.wins} {w.wins === 1 ? 'vitória' : 'vitórias'}
                      {w.confirmed_count != null ? ` · ${w.confirmed_count} comparecimentos` : ''}
                      {w.academic_unit
                        ? ` · ${UNIT_LABELS[w.academic_unit] || w.academic_unit}`
                        : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => generate(w)}
                  disabled={generating === w.user_cpf}
                  className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {generating === w.user_cpf ? (
                    'Gerando…'
                  ) : (
                    <>
                      <Gift size={15} /> Gerar voucher
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
