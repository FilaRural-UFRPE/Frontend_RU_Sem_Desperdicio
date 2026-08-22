import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Gift, Printer, ShieldCheck, Sparkles } from 'lucide-react'
import { voucherAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

const formatDate = (value) => new Intl.DateTimeFormat('pt-BR').format(new Date(value))

export default function VoucherPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const qrRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [data, setData] = useState({ confirmed_count: 0, vouchers: [] })

  const load = async () => {
    try {
      const response = await voucherAPI.mine()
      setData(response.data.data)
    } catch (error) {
      toast(error.response?.data?.detail || 'Não foi possível carregar seus vouchers', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const active = useMemo(() => data.vouchers.find((voucher) => voucher.status === 'active'), [data])
  const progress = Math.min(data.confirmed_count, 10)

  const generate = async () => {
    setGenerating(true)
    try {
      const { data: result } = await voucherAPI.generate()
      if (!result.success) throw new Error(result.msg)
      toast('Voucher gerado. Ele já está pronto para usar.')
      await load()
    } catch (error) {
      toast(error.response?.data?.detail || error.message || 'Não foi possível gerar o voucher', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const download = () => {
    const canvas = qrRef.current?.querySelector('canvas')
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
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">Benefício por frequência</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ru-charcoal mt-2">Meu voucher</h1>
        <p className="text-ru-muted mt-2">Cada 10 refeições confirmadas liberam uma entrada gratuita.</p>
      </header>

      <section className="card overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-ru-yellow/10 rounded-bl-full" />
        <div className="relative flex flex-col md:flex-row md:items-end gap-5 justify-between">
          <div>
            <div className="flex items-center gap-2 text-ru-blue font-display font-semibold"><Sparkles size={18} /> Seu caminho até a próxima</div>
            <p className="font-display text-5xl font-bold text-ru-charcoal mt-4">{progress}<span className="text-xl text-ru-muted">/10</span></p>
            <p className="text-sm text-ru-muted mt-1">{progress >= 10 ? 'Você já pode gerar seu voucher.' : `Faltam ${10 - progress} refeições confirmadas.`}</p>
          </div>
          {!active && <button className="btn-primary" disabled={progress < 10 || generating} onClick={generate}>
            {generating ? 'Gerando…' : <span className="inline-flex items-center gap-2"><Gift size={18} /> Gerar voucher</span>}
          </button>}
        </div>
        <div className="mt-6 h-3 bg-ru-cream-dark rounded-full overflow-hidden" aria-label={`${progress} de 10 refeições`}>
          <div className="h-full bg-gradient-to-r from-ru-blue to-ru-blue-light rounded-full transition-all" style={{ width: `${progress * 10}%` }} />
        </div>
      </section>

      {active ? (
        <section className="voucher-ticket bg-ru-blue-dark text-white rounded-3xl overflow-hidden shadow-xl grid md:grid-cols-[1fr_auto]">
          <div className="p-7 md:p-10 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-blue-100"><ShieldCheck size={16} /> Assinado digitalmente</span>
              <h2 className="font-display text-3xl font-bold mt-5">Uma refeição por nossa conta.</h2>
              <p className="text-blue-100 mt-3 max-w-md">Apresente este QR no balcão junto com seu ID. Ele funciona mesmo quando a conexão estiver indisponível.</p>
            </div>
            <div className="mt-8 pt-5 border-t border-white/20 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div><p className="text-blue-200 text-xs uppercase tracking-wide">Titular</p><p className="font-semibold mt-1">{user?.name}</p></div>
              <div><p className="text-blue-200 text-xs uppercase tracking-wide">Válido até</p><p className="font-semibold mt-1">{formatDate(active.expires_at)}</p></div>
              <div><p className="text-blue-200 text-xs uppercase tracking-wide">Voucher</p><p className="font-mono font-semibold mt-1">#{active.id}</p></div>
            </div>
          </div>
          <div className="bg-white p-7 flex flex-col items-center justify-center text-ru-charcoal relative voucher-stub" ref={qrRef}>
            <QRCodeCanvas value={active.qr_data} size={210} level="M" marginSize={1} />
            <p className="font-mono text-[10px] tracking-widest uppercase mt-3 text-ru-muted">SmartRU · uso único</p>
          </div>
        </section>
      ) : (
        <section className="card text-center py-12">
          <Gift className="mx-auto text-ru-muted" size={34} />
          <h2 className="font-display font-semibold text-xl mt-4">Nenhum voucher ativo</h2>
          <p className="text-ru-muted text-sm mt-2">Seu próximo voucher aparecerá aqui quando você completar a meta.</p>
        </section>
      )}

      {active && <div className="flex justify-end gap-3 print:hidden">
        <button className="btn-secondary inline-flex items-center gap-2" onClick={() => window.print()}><Printer size={17} /> Imprimir</button>
        <button className="btn-primary inline-flex items-center gap-2" onClick={download}><Download size={17} /> Baixar PNG</button>
      </div>}
    </div>
  )
}
