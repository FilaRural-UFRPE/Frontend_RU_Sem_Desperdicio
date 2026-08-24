import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ClipboardList, Search, UtensilsCrossed } from 'lucide-react'
import { campaignAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import Spinner from '../../components/ui/Spinner'
import { formatLocalDate } from '../../utils/helpers'

const formatDate = formatLocalDate

export default function EventVoucherHistoryPage() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState([])
  const [campaignId, setCampaignId] = useState(null)
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [campaignError, setCampaignError] = useState(false)

  const toggleExpand = async (voucher) => {
    if (expanded === voucher.id) { setExpanded(null); return }
    setExpanded(voucher.id)
    try {
      const { data } = await campaignAPI.getVoucher(voucher.id)
      if (data.success) {
        setVouchers((list) => list.map((v) => (v.id === voucher.id ? { ...v, usages: data.data.usages } : v)))
      }
    } catch { /* mantém sem detalhes */ }
  }

  const loadCampaigns = useCallback(async () => {
    setCampaignError(false)
    try {
      const { data } = await campaignAPI.list()
      setCampaigns(data.data || [])
      if (data.data?.length) setCampaignId((id) => id ?? data.data[0].id)
      else setLoading(false)
    } catch {
      setCampaignError(true)
      setLoading(false)
    }
  }, [])

  const loadVouchers = useCallback(async (id) => {
    setLoading(true)
    try {
      const { data } = await campaignAPI.listVouchers(id)
      setVouchers(data.data || [])
    } catch (error) {
      toast(error.response?.data?.msg || 'Erro ao carregar vouchers', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])
  useEffect(() => { if (campaignId) loadVouchers(campaignId) }, [campaignId, loadVouchers])

  const filtered = vouchers.filter((v) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return v.user_name?.toLowerCase().includes(q) || v.user_cpf?.includes(q) || v.code?.toLowerCase().includes(q)
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">Admin · RU Sem Desperdício</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Vouchers de evento</h1>
          <p className="text-ru-muted mt-2">Histórico de todos os vouchers de 5 almoços gerados na roleta.</p>
        </div>
        {campaigns.length > 0 && (
          <div className="relative">
            <select
              value={campaignId ?? ''}
              onChange={(e) => setCampaignId(Number(e.target.value))}
              className="input-field pr-9 appearance-none"
            >
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ru-muted pointer-events-none" />
          </div>
        )}
      </header>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ru-muted" />
        <input
          className="input-field pl-9"
          placeholder="Buscar por nome, CPF ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20"><Spinner size={28} /></div>
      ) : campaignError ? (
        <section className="card text-center py-16">
          <ClipboardList className="mx-auto text-ru-muted" size={38} />
          <h2 className="font-display font-semibold text-xl mt-4">Não foi possível carregar as campanhas</h2>
          <button className="btn-primary mt-5" onClick={loadCampaigns}>Tentar novamente</button>
        </section>
      ) : filtered.length === 0 ? (
        <section className="card text-center py-16">
          <ClipboardList className="mx-auto text-ru-muted" size={38} />
          <h2 className="font-display font-semibold text-xl mt-4">Nenhum voucher encontrado</h2>
          <p className="text-ru-muted text-sm mt-2">Nenhum voucher de evento foi gerado para esta campanha ainda.</p>
        </section>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const isOpen = expanded === v.id
            return (
              <div key={v.id} className="card">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => toggleExpand(v)}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ru-charcoal truncate">{v.user_name}</p>
                    <p className="font-mono text-xs text-ru-muted">{v.code} · {v.user_cpf}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="text-right">
                      <span className={`tag ${v.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-ru-cream text-ru-charcoal'}`}>
                        {v.status === 'active' ? `${v.meals_used}/${v.total_meals}` : v.status}
                      </span>
                    </div>
                    <ChevronDown size={18} className={`text-ru-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-ru-cream-dark">
                    <p className="text-sm text-ru-muted">Emitido em {formatDate(v.issued_at)}</p>
                    {v.expires_at && <p className="text-sm text-ru-muted">Válido até {formatDate(v.expires_at)}</p>}
                    <p className="text-sm font-medium mt-3 flex items-center gap-2"><UtensilsCrossed size={14} className="text-ru-blue" /> Refeições usadas</p>
                    {v.usages?.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {v.usages.map((u) => (
                          <div key={u.id} className="flex items-center justify-between rounded-lg bg-ru-cream px-3 py-1.5 text-sm">
                            <span>{formatDate(u.meal_date)}</span>
                            <span className="text-ru-muted">{u.meal_type === 'lunch' ? 'Almoço' : 'Jantar'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-ru-muted mt-2">Nenhuma refeição utilizada ainda.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          <p className="text-xs text-ru-muted text-center">{filtered.length} voucher{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  )
}
