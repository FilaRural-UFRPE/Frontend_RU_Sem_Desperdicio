import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CheckCircle2, Cloud, CloudOff, Keyboard, RefreshCw, ShieldCheck } from 'lucide-react'
import api, { voucherAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { fetchAndCachePublicKey, getCachedPublicKey, parseQRData, verifyVoucherSignature } from '../../utils/voucherCrypto'
import { checkLocalUsage, getPendingUsages, removeLocalUsages, saveLocalUsage } from '../../utils/voucherDB'
import { formatLocalDate } from '../../utils/helpers'

const formatDate = formatLocalDate

export default function VoucherValidatePage() {
  const { toast } = useToast()
  const scannerRef = useRef(null)
  const busyRef = useRef(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [cameraOn, setCameraOn] = useState(false)
  const [manual, setManual] = useState('')
  const [result, setResult] = useState(null)
  const [pending, setPending] = useState(0)
  const [usesToday, setUsesToday] = useState(0)

  const refreshPending = useCallback(async () => setPending((await getPendingUsages()).length), [])

  const syncPending = useCallback(async () => {
    const usages = await getPendingUsages()
    if (!navigator.onLine || !usages.length) return
    try {
      const { data } = await voucherAPI.sync(usages.map(({ voucher_id, used_at }) => ({ voucher_id, used_at })))
      await removeLocalUsages(usages.map((item) => item.voucher_id))
      await refreshPending()
      if (data.rejected) toast(`${data.rejected} uso(s) offline já estavam usados ou expirados.`, 'warning')
    } catch { /* permanece na fila para a próxima tentativa */ }
  }, [refreshPending, toast])

  useEffect(() => {
    const onOnline = () => { setOnline(true); fetchAndCachePublicKey(api).catch(() => {}); syncPending() }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    refreshPending()
    if (navigator.onLine) fetchAndCachePublicKey(api).then(syncPending).catch(() => {})
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [refreshPending, syncPending])

  const validate = useCallback(async (rawData) => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      const parsed = parseQRData(rawData.trim())
      if (new Date(parsed.e) <= new Date()) throw new Error('Voucher expirado')
      if (await checkLocalUsage(parsed.id)) throw new Error('Este voucher já foi registrado neste dispositivo')
      const validSignature = await verifyVoucherSignature(getCachedPublicKey(), parsed)
      if (!validSignature) throw new Error('Assinatura inválida')

      let storedOffline = !navigator.onLine
      if (navigator.onLine) {
        try {
          const { data } = await voucherAPI.validate({ voucher_id: parsed.id, nonce: parsed.n, signature_hex: parsed.s })
          if (!data.valid) throw new Error(data.message)
          setResult({ ...parsed, student_name: data.student_name, offline: false })
        } catch (error) {
          if (error.response) throw error
          storedOffline = true
        }
      }
      if (storedOffline) {
        await saveLocalUsage({ voucher_id: parsed.id, used_at: new Date().toISOString() })
        setResult({ ...parsed, student_name: 'Identidade conferida no balcão', offline: true })
        await refreshPending()
      }
      setUsesToday((count) => count + 1)
      toast(storedOffline ? 'Voucher validado e salvo para sincronizar' : 'Voucher validado com sucesso')
    } catch (error) {
      setResult(null)
      toast(error.response?.data?.message || error.response?.data?.detail || error.message || 'Não foi possível validar', 'error')
    } finally {
      window.setTimeout(() => { busyRef.current = false }, 1200)
    }
  }, [refreshPending, toast])

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner?.isScanning) await scanner.stop().catch(() => {})
    try { scanner?.clear() } catch { /* leitor já desmontado */ }
    setCameraOn(false)
  }, [])

  const startCamera = async () => {
    setResult(null)
    const scanner = new Html5Qrcode('voucher-reader')
    scannerRef.current = scanner
    try {
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, validate)
      setCameraOn(true)
    } catch {
      scannerRef.current = null
      toast('Não foi possível abrir a câmera. Confira a permissão do navegador.', 'error')
    }
  }

  useEffect(() => () => { stopCamera() }, [stopCamera])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">Balcão · entrada gratuita</p><h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Validar voucher</h1><p className="text-ru-muted mt-2">Confira o ID do estudante e leia o QR apresentado.</p></div>
        <div className={`tag ${online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{online ? <Cloud size={15} /> : <CloudOff size={15} />}{online ? 'Online' : 'Modo offline'}</div>
      </header>

      <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-6">
        <section className="card">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold flex items-center gap-2"><Camera size={20} className="text-ru-blue" /> Leitor</h2>{cameraOn && <button onClick={stopCamera} className="text-sm text-ru-muted hover:text-ru-charcoal">Fechar câmera</button>}</div>
          <div className="relative mt-5 min-h-72 rounded-2xl bg-ru-charcoal overflow-hidden">
            <div id="voucher-reader" className="voucher-reader" />
            {!cameraOn && <div className="absolute inset-0 grid place-items-center"><button onClick={startCamera} className="bg-white text-ru-blue px-5 py-3 rounded-xl font-semibold inline-flex items-center gap-2"><Camera size={18} /> Abrir câmera</button></div>}
          </div>
          <div className="mt-6 pt-6 border-t border-ru-cream-dark">
            <label className="font-display font-semibold flex items-center gap-2" htmlFor="voucher-code"><Keyboard size={18} className="text-ru-blue" /> Inserir código do QR</label>
            <p className="text-xs text-ru-muted mt-1">Use esta opção se a câmera não conseguir ler o código.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-3"><input id="voucher-code" className="input-field font-mono text-xs" value={manual} onChange={(event) => setManual(event.target.value)} placeholder='{"v":1,"id":…}' /><button className="btn-primary shrink-0" onClick={() => validate(manual)} disabled={!manual.trim()}>Validar código</button></div>
          </div>
        </section>

        <aside className="space-y-4">
          {result ? <section className="card border-2 border-emerald-200 bg-emerald-50/50">
            <CheckCircle2 size={38} className="text-emerald-600" /><h2 className="font-display text-2xl font-bold mt-4">Voucher válido</h2><p className="text-ru-charcoal font-semibold mt-4">{result.student_name}</p><p className="text-sm text-ru-muted mt-1">Válido até {formatDate(result.e)}</p><div className="mt-5 py-3 px-4 rounded-xl bg-white text-sm flex gap-2"><ShieldCheck size={18} className="text-ru-blue shrink-0" />{result.offline ? 'Assinatura verificada offline. O uso será sincronizado.' : 'Assinatura e uso confirmados no servidor.'}</div>
          </section> : <section className="card min-h-56 grid place-items-center text-center"><div><ShieldCheck size={34} className="mx-auto text-ru-muted" /><h2 className="font-display font-semibold mt-3">Aguardando leitura</h2><p className="text-sm text-ru-muted mt-2">O resultado da verificação aparecerá aqui.</p></div></section>}
          <section className="card"><div className="flex items-center justify-between text-sm"><span className="text-ru-muted">Usos nesta sessão</span><strong>{usesToday}</strong></div><div className="flex items-center justify-between text-sm mt-3"><span className="text-ru-muted">Pendentes de sincronização</span><strong>{pending}</strong></div>{pending > 0 && online && <button className="btn-secondary w-full mt-5 inline-flex justify-center items-center gap-2" onClick={syncPending}><RefreshCw size={16} /> Sincronizar agora</button>}</section>
        </aside>
      </div>
    </div>
  )
}
