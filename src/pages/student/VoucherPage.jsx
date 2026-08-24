import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  CheckCircle2,
  Download,
  Gift,
  Printer,
  ShieldCheck,
  Sparkles,
  Target,
  UtensilsCrossed,
} from 'lucide-react'
import { voucherAPI, campaignAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { formatLocalDate } from '../../utils/helpers'

const formatDate = formatLocalDate

export default function VoucherPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const regularQrRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ wins: 0, available_prizes: 0, vouchers: [] })
  const [eventVoucher, setEventVoucher] = useState(null)
  const [campaignProgress, setCampaignProgress] = useState(null)

  const load = async () => {
    try {
      const [regular, event, progress] = await Promise.allSettled([
        voucherAPI.mine(),
        campaignAPI.myVoucher(),
        campaignAPI.myProgress(),
      ])
      if (regular.status === 'fulfilled') setData(regular.value.data.data)
      if (event.status === 'fulfilled') setEventVoucher(event.value.data?.data ?? null)
      if (progress.status === 'fulfilled')
        setCampaignProgress(progress.value.data?.data ?? null)
      if (regular.status === 'rejected' && event.status === 'rejected') {
        throw regular.reason
      }
      if (regular.status === 'rejected')
        toast('Não foi possível carregar o voucher mensal', 'error')
      if (event.status === 'rejected')
        toast('Não foi possível carregar o voucher de evento', 'warning')
    } catch (error) {
      toast(error.response?.data?.detail || 'Não foi possível carregar seus vouchers', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const active = useMemo(() => data.vouchers.find((voucher) => voucher.status === 'active'), [data])

  const download = () => {
    const canvas = regularQrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `voucher-smartru-${active.id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (loading) return <div className="card max-w-4xl mx-auto animate-pulse h-80" />

  return (
    <div className="max-w-5xl mx-auto space-y-6 voucher-page">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">
          Premiação por sorteio
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ru-charcoal mt-2">
          Meu voucher
        </h1>
        <p className="text-ru-muted mt-2">
          Participe dos sorteios do SmartRU: cada comparecimento ao RU te coloca na lista de
          elegíveis. Sorteados recebem uma refeição gratuita.
        </p>
      </header>

      <section className="card overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-ru-yellow/10 rounded-bl-full" />
        <div className="relative">
          <div className="flex items-center gap-2 text-ru-blue font-display font-semibold">
            <Sparkles size={18} /> Minha premiação
          </div>
          <p className="font-display text-5xl font-bold text-ru-charcoal mt-4">
            {data.wins}
            <span className="text-xl text-ru-muted ml-1">
              {data.wins === 1 ? 'vitória' : 'vitórias'}
            </span>
          </p>
          <p className="text-sm text-ru-muted mt-1">
            {data.available_prizes > 0
              ? 'Você foi sorteado! Aguarde o funcionário gerar seu voucher.'
              : data.wins > 0
                ? 'Suas premiações já foram resgatadas.'
                : 'Compareça ao RU e participe dos sorteios para ganhar um voucher.'}
          </p>
        </div>
      </section>

      {campaignProgress?.campaign && (
        <section className="card overflow-hidden relative">
          <div className="absolute right-0 top-0 w-32 h-32 bg-ru-yellow/10 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-ru-blue font-display font-semibold">
                <Target size={18} /> Campanha RU Sem Desperdício
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-ru-muted">
                {campaignProgress.campaign.name}
              </span>
            </div>
            <div className="grid sm:grid-cols-[auto_1fr] gap-6 mt-5 items-center">
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-ru-charcoal">
                  {campaignProgress.progress?.presence_days ?? 0}
                  <span className="text-lg text-ru-muted ml-1">
                    / {campaignProgress.campaign.required_days}
                  </span>
                </p>
                <p className="text-xs text-ru-muted mt-1">dias de agendamento e presença</p>
              </div>
              <div>
                <div className="h-3 rounded-full bg-ru-cream-dark overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-ru-blue"
                    style={{
                      width: `${Math.min(
                        100,
                        ((campaignProgress.progress?.presence_days ?? 0) /
                          campaignProgress.campaign.required_days) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-ru-muted mt-3">
                  {campaignProgress.progress?.is_eligible ? (
                    <span className="inline-flex items-center gap-2 font-semibold text-emerald-600">
                      <CheckCircle2 size={16} /> Nota conquistada! Você tem direito a concorrer na
                      roleta do evento.
                    </span>
                  ) : campaignProgress.progress ? (
                    `Faltam ${Math.max(
                      0,
                      campaignProgress.campaign.required_days -
                        campaignProgress.progress.presence_days
                    )} dias para ganhar a nota e concorrer na roleta.`
                  ) : (
                    'Agende e compareça ao RU para acumular dias e ganhar sua nota.'
                  )}
                </p>
                <p className="text-xs text-ru-muted mt-2">
                  {campaignProgress.progress?.points !== undefined && (
                    <>Pontuação: {campaignProgress.progress.points} · </>
                  )}
                  Evento em {formatDate(campaignProgress.campaign.event_date)}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {active ? (
        <section className="voucher-ticket bg-ru-blue-dark text-white rounded-3xl overflow-hidden shadow-xl grid md:grid-cols-[1fr_auto]">
          <div className="p-7 md:p-10 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-blue-100">
                <ShieldCheck size={16} /> Assinado digitalmente
              </span>
              <h2 className="font-display text-3xl font-bold mt-5">
                Uma refeição por nossa conta.
              </h2>
              <p className="text-blue-100 mt-3 max-w-md">
                Sua premiação por ser sorteado. Apresente este QR no balcão junto com seu ID. Ele
                funciona mesmo quando a conexão estiver indisponível.
              </p>
            </div>
            <div className="mt-8 pt-5 border-t border-white/20 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-wide">Titular</p>
                <p className="font-semibold mt-1">{user?.name}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-wide">Válido até</p>
                <p className="font-semibold mt-1">{formatDate(active.expires_at)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-wide">Voucher</p>
                <p className="font-mono font-semibold mt-1">#{active.id}</p>
              </div>
            </div>
          </div>
          <div
            className="bg-white p-7 flex flex-col items-center justify-center text-ru-charcoal relative voucher-stub"
            ref={regularQrRef}
          >
            <QRCodeCanvas value={active.qr_data} size={210} level="M" marginSize={1} />
            <p className="font-mono text-[10px] tracking-widest uppercase mt-3 text-ru-muted">
              SmartRU · uso único
            </p>
          </div>
        </section>
      ) : (
        <section className="card text-center py-12">
          <Gift className="mx-auto text-ru-muted" size={34} />
          <h2 className="font-display font-semibold text-xl mt-4">Nenhum voucher ativo</h2>
          <p className="text-ru-muted text-sm mt-2">
            Você ganha um voucher ao ser sorteado entre os participantes. Seu prêmio aparecerá aqui.
          </p>
        </section>
      )}

      {active && (
        <div className="flex justify-end gap-3 print:hidden">
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => window.print()}
          >
            <Printer size={17} /> Imprimir
          </button>
          <button className="btn-primary inline-flex items-center gap-2" onClick={download}>
            <Download size={17} /> Baixar PNG
          </button>
        </div>
      )}

      <section className="pt-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue flex items-center gap-2">
          <UtensilsCrossed size={14} /> Campanha RU Sem Desperdício
        </p>
        <h2 className="font-display text-2xl font-bold text-ru-charcoal mt-1">Voucher de evento</h2>
        {eventVoucher ? (
          <div className="voucher-ticket bg-ru-blue-dark text-white rounded-3xl overflow-hidden shadow-xl grid md:grid-cols-[1fr_auto] mt-4">
            <div className="p-7 md:p-8 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-blue-100">
                  <ShieldCheck size={16} /> QR code de evento
                </span>
                <h3 className="font-display text-2xl font-bold mt-4">5 almoços no RU.</h3>
                <p className="text-blue-100 mt-2 max-w-md text-sm">
                  Você foi premiado na roleta da campanha. Apresente este QR no caixa a cada almoço.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-blue-200 text-xs uppercase tracking-wide">Titular</p>
                  <p className="font-semibold mt-1">{user?.name}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs uppercase tracking-wide">Código</p>
                  <p className="font-mono font-semibold mt-1">{eventVoucher.code}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs uppercase tracking-wide">Refeições</p>
                  <p className="font-semibold mt-1">
                    {eventVoucher.meals_used} / {eventVoucher.total_meals}
                  </p>
                </div>
              </div>
              {eventVoucher.usages?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-blue-200 text-xs uppercase tracking-wide mb-2">Histórico</p>
                  <div className="flex flex-wrap gap-2">
                    {eventVoucher.usages.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs"
                      >
                        <UtensilsCrossed size={12} /> {formatDate(u.meal_date)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white p-7 flex flex-col items-center justify-center text-ru-charcoal relative voucher-stub">
              <QRCodeCanvas value={eventVoucher.qr_data} size={200} level="M" marginSize={1} />
              <p className="font-mono text-[10px] tracking-widest uppercase mt-3 text-ru-muted">
                SmartRU · evento
              </p>
            </div>
          </div>
        ) : (
          <div className="card text-center py-10 mt-4">
            <Gift className="mx-auto text-ru-muted" size={28} />
            <h3 className="font-display font-semibold text-lg mt-3">Nenhum voucher de evento</h3>
            <p className="text-ru-muted text-sm mt-1">
              Complete 10 dias de agendamento e presença para concorrer na roleta da campanha.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
