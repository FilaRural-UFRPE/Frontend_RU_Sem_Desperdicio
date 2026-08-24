import { useCallback, useEffect, useMemo, useState } from 'react'
import { WheelCanvas } from 'react-custom-roulette'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Candy,
  CheckCircle2,
  ChevronDown,
  Gift,
  Printer,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { campaignAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { localISODate } from '../../utils/helpers'

const PRIZE_META = {
  voucher: { label: 'Voucher 1 semana', icon: Gift, color: '#1a3a8f', highlight: '#f5a623' },
  redbull: { label: 'Red Bull', icon: Zap, color: '#df3428', highlight: '#f5a623' },
  candy: { label: 'Doce', icon: Candy, color: '#f5a623', highlight: '#fff' },
}

const PRIZE_ORDER = ['voucher', 'redbull', 'candy']

const formatDate = (value) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export default function RoletaPage() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState([])
  const [campaignId, setCampaignId] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  // Roleta
  const [mustSpin, setMustSpin] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [prizeNumber, setPrizeNumber] = useState(0)
  const [pendingSpin, setPendingSpin] = useState(null)
  const [showResult, setShowResult] = useState(false)

  // Registro de voucher
  const [voucherForm, setVoucherForm] = useState({ user_cpf: '' })
  const [registering, setRegistering] = useState(false)
  const [issuedVoucher, setIssuedVoucher] = useState(null)

  const loadCampaigns = useCallback(async () => {
    try {
      const { data } = await campaignAPI.list()
      setCampaigns(data.data || [])
      if (data.data?.length) {
        setCampaignId((current) => current ?? data.data[0].id)
      } else {
        setCampaignId(null)
      }
    } catch {
      toast('Erro ao listar campanhas', 'error')
    }
  }, [toast])

  const loadCampaign = useCallback(
    async (id) => {
      setLoading(true)
      try {
        const { data } = await campaignAPI.get(id)
        setCampaign(data.data)
        const { data: part } = await campaignAPI.participants(id, true)
        setParticipants(part.data || [])
      } catch (error) {
        toast(
          error.response?.data?.detail?.msg ||
            error.response?.data?.msg ||
            'Erro ao carregar campanha',
          'error'
        )
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  useEffect(() => {
    if (campaignId) loadCampaign(campaignId)
    else {
      setCampaign(null)
      setLoading(false)
    }
  }, [campaignId, loadCampaign])

  const segments = useMemo(() => {
    if (!campaign?.prizes) return []
    const list = []
    for (const prizeType of PRIZE_ORDER) {
      const prize = campaign.prizes.find((p) => p.prize_type === prizeType)
      if (!prize || prize.remaining <= 0) continue
      for (let i = 0; i < prize.remaining; i += 1) {
        list.push({
          option: PRIZE_META[prizeType].label,
          prizeType,
          style: {
            backgroundColor: PRIZE_META[prizeType].color,
            textColor: '#ffffff',
            fontWeight: '600',
          },
        })
      }
    }
    return list
  }, [campaign])

  const totalRemaining = useMemo(
    () => (campaign?.prizes || []).reduce((sum, p) => sum + p.remaining, 0),
    [campaign]
  )

  const winnerIndex = (prizeType) => segments.findIndex((s) => s.prizeType === prizeType)

  const handleSpin = async () => {
    if (mustSpin || spinning) return
    setSpinning(true)
    try {
      const { data } = await campaignAPI.spin(campaignId)
      if (!data.success) {
        toast(data.msg, 'error')
        return
      }
      setPendingSpin(data.data)
      const index = winnerIndex(data.data.prize_type)
      setPrizeNumber(index < 0 ? 0 : index)
      setMustSpin(true)
    } catch (error) {
      toast(
        error.response?.data?.detail?.msg || error.response?.data?.msg || 'Erro ao girar a roleta',
        'error'
      )
    } finally {
      setSpinning(false)
    }
  }

  const onStopSpinning = () => {
    setMustSpin(false)
    setShowResult(true)
  }

  const confirmPrize = async () => {
    const cpf = (pendingSpin.prize_type !== 'voucher' ? voucherForm.user_cpf.replace(/\D/g, '') : null)
    if (cpf && cpf.length !== 11) {
      toast('Informe um CPF válido para registrar o ganhador', 'error')
      return
    }
    try {
      const { data } = await campaignAPI.confirmSpin(pendingSpin.spin_id, cpf)
      if (!data.success) {
        toast(data.msg || 'Erro ao confirmar', 'error')
        return
      }
      toast(`${PRIZE_META[pendingSpin.prize_type].label} entregue${cpf ? '!' : '!'}`, 'success')
      closeResult()
    } catch (error) {
      toast(
        error.response?.data?.detail?.msg || error.response?.data?.msg || 'Erro ao confirmar',
        'error'
      )
    }
  }

  const cancelSpin = async () => {
    try {
      const { data } = await campaignAPI.cancelSpin(pendingSpin.spin_id)
      if (!data.success) {
        toast(data.msg || 'Erro ao cancelar', 'error')
        return
      }
      toast('Giro cancelado e prêmio devolvido à roleta', 'warning')
      closeResult()
    } catch (error) {
      toast(
        error.response?.data?.detail?.msg || error.response?.data?.msg || 'Erro ao cancelar',
        'error'
      )
    }
  }

  const registerVoucher = async () => {
    const cpf = voucherForm.user_cpf.replace(/\D/g, '')
    if (cpf.length !== 11) {
      toast('CPF inválido', 'error')
      return
    }
    setRegistering(true)
    try {
      const { data } = await campaignAPI.registerVoucher(pendingSpin.spin_id, cpf)
      if (!data.success) {
        toast(data.msg, 'error')
        return
      }
      setIssuedVoucher(data.data.voucher)
      toast('Voucher gerado com QR code!', 'success')
    } catch (error) {
      toast(
        error.response?.data?.detail?.msg || error.response?.data?.msg || 'Erro ao gerar voucher',
        'error'
      )
    } finally {
      setRegistering(false)
    }
  }

  const closeResult = async () => {
    setShowResult(false)
    setPendingSpin(null)
    setIssuedVoucher(null)
    setVoucherForm({ user_cpf: '' })
    if (campaignId) await loadCampaign(campaignId)
  }

  const recompute = async () => {
    setComputing(true)
    try {
      const { data } = await campaignAPI.computeStats(campaignId)
      toast(`Presença recalculada: ${data.data?.eligible_count ?? 0} elegíveis`, 'success')
      await loadCampaign(campaignId)
    } catch (error) {
      toast(
        error.response?.data?.detail?.msg || error.response?.data?.msg || 'Erro ao recalcular',
        'error'
      )
    } finally {
      setComputing(false)
    }
  }

  const printQr = () => {
    const canvas = document.querySelector('#issued-qr canvas')
    if (!canvas) return
    const win = window.open('', '_blank')
    win.document.write(
      `<img src="${canvas.toDataURL('image/png')}" style="width:100%;max-width:420px"/>`
    )
    win.print()
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto card flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">
            Evento · RU Sem Desperdício
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ru-charcoal mt-2">
            Roleta de prêmios
          </h1>
          <p className="text-ru-muted mt-2">
            Gire presencialmente no dia do desafio e registre os vencedores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={campaignId ?? ''}
              onChange={(e) => setCampaignId(Number(e.target.value))}
              className="input-field pr-9 appearance-none"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ru-muted pointer-events-none"
            />
          </div>
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => setShowSetup(true)}
          >
            <Sparkles size={16} /> Nova campanha
          </button>
        </div>
      </header>

      {!campaign ? (
        <section className="card text-center py-16">
          <Trophy className="mx-auto text-ru-muted" size={38} />
          <h2 className="font-display font-semibold text-xl mt-4">Nenhuma campanha configurada</h2>
          <p className="text-ru-muted text-sm mt-2 max-w-md mx-auto">
            Configure a campanha do evento definindo o dia do desafio, a janela de presença e as
            quantidades de prêmios.
          </p>
          <button
            className="btn-primary mt-6 inline-flex items-center gap-2"
            onClick={() => setShowSetup(true)}
          >
            <Sparkles size={17} /> Criar campanha
          </button>
        </section>
      ) : (
        <>
          <section className="card grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Dia do desafio" value={formatDate(campaign.event_date)} />
            <Stat label="Janela de presença" value={`últimos ${campaign.days_lookback} dias`} />
            <Stat
              label="Elegíveis (nota)"
              value={`${campaign.eligible_count ?? 0} participantes`}
            />
            <Stat label="Giros realizados" value={`${campaign.spins_count ?? 0}`} />
          </section>

          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-semibold text-lg text-ru-charcoal">
                  Estoque de prêmios
                </h2>
                <p className="text-xs text-ru-muted mt-1">
                  Quando um prêmio esgota, ele sai da roleta e os espaços são redistribuídos.
                </p>
              </div>
              <button
                className="btn-secondary inline-flex items-center gap-2 text-sm"
                onClick={recompute}
                disabled={computing}
              >
                <RefreshCw size={15} className={computing ? 'animate-spin' : ''} /> Recalcular
                presença
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {PRIZE_ORDER.map((type) => {
                const prize = campaign.prizes?.find((p) => p.prize_type === type)
                const meta = PRIZE_META[type]
                const Icon = meta.icon
                const pct = prize ? Math.round((prize.remaining / prize.total) * 100) : 0
                return (
                  <div
                    key={type}
                    className={`rounded-2xl border p-4 ${prize?.remaining ? 'border-ru-cream-dark bg-ru-cream/40' : 'border-red-200 bg-red-50 opacity-60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-xl grid place-items-center text-white"
                        style={{ backgroundColor: meta.color }}
                      >
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="font-display font-semibold text-ru-charcoal">{meta.label}</p>
                        <p className="text-xs text-ru-muted">
                          {prize?.remaining ?? 0} / {prize?.total ?? 0} restantes
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-ru-cream-dark mt-4 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
            <div className="card flex flex-col items-center">
              <h2 className="font-display font-semibold text-lg text-ru-charcoal mb-4 self-start">
                Rode a roleta
              </h2>

              <div className="roulette-wheel relative w-full max-w-[480px] aspect-square overflow-hidden">
                {segments.length > 0 && (
                  <WheelCanvas
                    key={segments.map((s) => s.prizeType).join('-')}
                    width={480}
                    height={480}
                    data={segments}
                    prizeNumber={prizeNumber}
                    mustStartSpinning={mustSpin}
                    onStopSpinning={onStopSpinning}
                    outerBorderColor="#e2e8f0"
                    outerBorderWidth={6}
                    innerRadius={34}
                    innerBorderColor="#1a3a8f"
                    innerBorderWidth={6}
                    radiusLineColor="#ffffff"
                    radiusLineWidth={2}
                    fontSize={16}
                    textDistance={62}
                    perpendicularText
                    backgroundColors={['#ffffff']}
                    textColors={['#ffffff']}
                  />
                )}
                {segments.length === 0 && (
                  <div className="w-full h-full grid place-items-center text-ru-muted">
                    <p className="text-center px-8">Todos os prêmios já foram sorteados.</p>
                  </div>
                )}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-ru-blue text-white grid place-items-center shadow-lg border-4 border-white pointer-events-none z-10">
                  <span className="font-display font-bold text-sm leading-tight text-center">
                    Smart RU
                  </span>
                </div>
              </div>

              <button
                className="btn-primary mt-6 px-10 py-3 text-lg font-display font-bold inline-flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSpin}
                disabled={mustSpin || spinning || totalRemaining === 0}
              >
                <Sparkles size={20} />{' '}
                {mustSpin ? 'Girando...' : spinning ? 'Sorteando...' : 'GIRAR ROLETA'}
              </button>
            </div>

            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-ru-charcoal flex items-center gap-2">
                    <Users size={16} className="text-ru-blue" /> Elegíveis ({participants.length})
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {participants.length === 0 && (
                    <p className="text-sm text-ru-muted">
                      Nenhum participante com {campaign.required_days} dias de presença ainda.
                    </p>
                  )}
                  {participants.map((p) => (
                    <div
                      key={p.user_cpf}
                      className="flex items-center justify-between rounded-xl bg-ru-cream px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-ru-charcoal truncate">{p.name}</p>
                        <p className="font-mono text-[11px] text-ru-muted">{p.user_cpf}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-mono text-xs font-semibold text-ru-blue">
                          {p.presence_days}d
                        </p>
                        <p className="font-mono text-[11px] text-ru-muted">{p.points} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-display font-semibold text-ru-charcoal mb-3 flex items-center gap-2">
                  <Trophy size={16} className="text-ru-blue" /> Últimos giros
                </h3>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {(campaign.spins || []).slice(0, 10).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-ru-charcoal truncate">{s.user_name || '—'}</span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PRIZE_META[s.prize_type]?.color }}
                        />
                        <span className="text-ru-muted">{PRIZE_META[s.prize_type]?.label}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {showSetup && (
        <CampaignSetup
          onClose={() => setShowSetup(false)}
          onCreated={(id) => {
            setShowSetup(false)
            setCampaignId(id)
          }}
        />
      )}

      {showResult && pendingSpin && !issuedVoucher && (
        <ResultModal
          prizeType={pendingSpin.prize_type}
          onConfirm={confirmPrize}
          onCancel={cancelSpin}
          onClose={cancelSpin}
        >
          <div>
            <label className="block text-sm font-medium text-ru-charcoal mb-1">
              {pendingSpin.prize_type === 'voucher'
                ? 'CPF do participante vencedor'
                : 'CPF do ganhador (opcional)'}
            </label>
            <input
              className="input-field"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={voucherForm.user_cpf}
              onChange={(e) => setVoucherForm({ user_cpf: e.target.value })}
            />
            {pendingSpin.prize_type === 'voucher' && (
              <button
                className="btn-primary w-full mt-4"
                onClick={registerVoucher}
                disabled={registering}
              >
                {registering ? 'Gerando...' : 'Gerar QR code do voucher'}
              </button>
            )}
          </div>
        </ResultModal>
      )}

      {issuedVoucher && (
        <Modal
          open
          onClose={() => {
            setIssuedVoucher(null)
            closeResult()
          }}
          title="Voucher gerado"
        >
          <div className="text-center">
            <p className="flex items-center justify-center gap-2 text-green-600 font-medium">
              <CheckCircle2 size={18} /> Voucher de 5 almoços liberado
            </p>
            <div
              className="my-5 inline-block bg-white border-2 border-dashed border-ru-blue/30 rounded-2xl p-5"
              id="issued-qr"
            >
              <QRCodeCanvas value={issuedVoucher.qr_data} size={220} level="M" marginSize={1} />
              <p className="font-mono text-[10px] tracking-widest uppercase mt-3 text-ru-muted">
                SmartRU · evento {issuedVoucher.code}
              </p>
            </div>
            <div className="flex items-center justify-center gap-6 text-left text-sm bg-ru-cream rounded-2xl p-4">
              <div>
                <p className="text-ru-muted text-xs">Titular</p>
                <p className="font-semibold text-ru-charcoal">{issuedVoucher.user_name}</p>
              </div>
              <div>
                <p className="text-ru-muted text-xs">Almoços</p>
                <p className="font-semibold text-ru-charcoal">{issuedVoucher.total_meals}</p>
              </div>
              <div>
                <p className="text-ru-muted text-xs">Válido até</p>
                <p className="font-semibold text-ru-charcoal">
                  {formatDate(issuedVoucher.expires_at)}
                </p>
              </div>
            </div>
            <button
              className="btn-secondary mt-5 inline-flex items-center gap-2 w-full justify-center"
              onClick={printQr}
            >
              <Printer size={17} /> Imprimir QR code
            </button>
            <button className="btn-primary mt-2 w-full" onClick={() => closeResult()}>
              Concluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ru-muted uppercase tracking-wide font-mono">{label}</p>
      <p className="font-display font-semibold text-ru-charcoal mt-1">{value}</p>
    </div>
  )
}

function ResultModal({ prizeType, children, onConfirm, onCancel, onClose }) {
  const meta = PRIZE_META[prizeType]
  const Icon = meta.icon
  return (
    <Modal open onClose={onClose} title="Resultado do giro">
      <div className="text-center">
        <div
          className="mx-auto w-16 h-16 rounded-2xl grid place-items-center text-white shadow-lg"
          style={{ backgroundColor: meta.color }}
        >
          <Icon size={30} />
        </div>
        <h3 className="font-display text-2xl font-bold text-ru-charcoal mt-4">
          Ganhou {meta.label}!
        </h3>
        {prizeType === 'voucher' ? (
          <>
            <p className="text-sm text-ru-muted mt-2">
              Preencha os dados do participante para gerar o QR code de 5 almoços no RU.
            </p>
            <div className="mt-5 text-left">{children}</div>
          </>
        ) : (
          <>
            <p className="text-sm text-ru-muted mt-2">
              Entregue o prêmio ao participante. Informe o CPF para registrar o ganhador no
              histórico.
            </p>
            <div className="mt-5 text-left">{children}</div>
            <div className="flex gap-3 mt-5">
              <button
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                onClick={onCancel}
              >
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                onClick={onConfirm}
              >
                <CheckCircle2 size={16} /> Entreguei
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function CampaignSetup({ onClose, onCreated }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: `Desafio ${new Date().toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' })}`,
    event_date: localISODate(),
    days_lookback: 12,
    required_days: 10,
    voucher: 1,
    redbull: 4,
    candy: 5,
  })
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) {
      toast('Informe o nome da campanha', 'error')
      return
    }
    setSaving(true)
    try {
      const { data } = await campaignAPI.create({
        name: form.name.trim(),
        event_date: form.event_date,
        days_lookback: Number(form.days_lookback),
        required_days: Number(form.required_days),
        prizes: {
          voucher: Number(form.voucher),
          redbull: Number(form.redbull),
          candy: Number(form.candy),
        },
      })
      if (!data.success) {
        toast(data.msg, 'error')
        return
      }
      toast('Campanha criada e presença calculada!', 'success')
      onCreated(data.data.id)
    } catch (error) {
      toast(
        error.response?.data?.detail?.msg || error.response?.data?.msg || 'Erro ao criar campanha',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const label = 'block text-sm font-medium text-ru-charcoal mb-1'

  return (
    <Modal open onClose={onClose} title="Nova campanha">
      <div className="space-y-4">
        <div>
          <label className={label}>Nome da campanha</label>
          <input className="input-field" value={form.name} onChange={set('name')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Dia do desafio</label>
            <input
              type="date"
              className="input-field"
              value={form.event_date}
              onChange={set('event_date')}
            />
          </div>
          <div>
            <label className={label}>Dias para a nota</label>
            <input
              type="number"
              min="1"
              max="30"
              className="input-field"
              value={form.required_days}
              onChange={set('required_days')}
            />
          </div>
        </div>
        <div>
          <label className={label}>Janela de presença (dias antes do evento)</label>
          <input
            type="number"
            min="1"
            max="60"
            className="input-field"
            value={form.days_lookback}
            onChange={set('days_lookback')}
          />
        </div>

        <div className="rounded-2xl bg-ru-cream p-4">
          <p className="font-display font-semibold text-ru-charcoal mb-3">Prêmios da roleta</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              ['voucher', 'Vouchers', Gift, '#1a3a8f'],
              ['redbull', 'Red Bulls', Zap, '#df3428'],
              ['candy', 'Doces', Candy, '#f5a623'],
            ].map(([key, labelText, Icon, color]) => (
              <div key={key}>
                <label className={label}>
                  <span className="inline-flex items-center gap-1">
                    <Icon size={14} style={{ color }} /> {labelText}
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={form[key]}
                  onChange={set(key)}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-ru-muted mt-3">
            A roleta terá um campo por prêmio (ex.: 1 voucher + 4 Red Bulls + 5 doces = 10 campos).
          </p>
        </div>

        <button className="btn-primary w-full" onClick={submit} disabled={saving}>
          {saving ? 'Criando...' : 'Criar campanha e calcular presença'}
        </button>
      </div>
    </Modal>
  )
}
