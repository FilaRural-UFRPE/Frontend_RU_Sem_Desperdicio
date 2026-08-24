import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CheckCircle2, History, Keyboard, ScrollText, UtensilsCrossed } from 'lucide-react'
import api, { campaignAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import {
  fetchAndCachePublicKey,
  getCachedPublicKey,
  parseQRData,
  verifyVoucherSignature,
} from '../../utils/voucherCrypto'
import { formatLocalDate, localISODate } from '../../utils/helpers'

const formatDate = formatLocalDate

export default function CashierPage() {
  const { toast } = useToast()
  const scannerRef = useRef(null)
  const busyRef = useRef(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [manual, setManual] = useState('')
  const [voucher, setVoucher] = useState(null)
  const [scannedQr, setScannedQr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [using, setUsing] = useState(false)
  const [usedToday, setUsedToday] = useState(false)

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner?.isScanning) await scanner.stop().catch(() => {})
    try {
      scanner?.clear()
    } catch {
      /* já desmontado */
    }
    setCameraOn(false)
  }, [])

  const startCamera = async () => {
    setVoucher(null)
    setScannedQr(null)
    setUsedToday(false)
    const scanner = new Html5Qrcode('evoucher-reader')
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        onScan
      )
      setCameraOn(true)
    } catch {
      scannerRef.current = null
      toast('Não foi possível abrir a câmera.', 'error')
    }
  }

  const loadVoucher = async (parsed) => {
    setLoading(true)
    setVoucher(null)
    setScannedQr(null)
    setUsedToday(false)
    try {
      let publicKey = getCachedPublicKey()
      if (!publicKey) publicKey = await fetchAndCachePublicKey(api)
      if (!(await verifyVoucherSignature(publicKey, parsed, api))) {
        throw new Error('Assinatura do QR code inválida')
      }
      if (new Date(parsed.e) <= new Date()) throw new Error('Voucher expirado')
      const { data } = await campaignAPI.getVoucher(parsed.id)
      if (!data.success) {
        toast(data.msg, 'error')
        return
      }
      if (data.data.user_cpf !== parsed.c) throw new Error('QR não pertence a este voucher')
      setVoucher(data.data)
      setScannedQr(parsed)
      const today = localISODate()
      setUsedToday(data.data.usages?.some((u) => u.meal_date === today))
    } catch (error) {
      toast(
        error.response?.data?.msg ||
          error.response?.data?.detail ||
          error.message ||
          'Erro ao buscar voucher',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const onScan = async (rawData) => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      const parsed = parseQRData(rawData.trim())
      if (parsed.v !== 2) throw new Error('Este QR não é um voucher de evento SmartRU')
      await loadVoucher(parsed)
    } catch (error) {
      toast(error.message || 'QR inválido', 'error')
    } finally {
      window.setTimeout(() => {
        busyRef.current = false
      }, 800)
    }
  }

  const useVoucher = async () => {
    if (!voucher || !scannedQr || usedToday || using) return
    setUsing(true)
    try {
      const { data } = await campaignAPI.useVoucher(voucher.id, scannedQr.n, scannedQr.s)
      if (!data.success) {
        toast(data.msg, 'error')
        return
      }
      toast(
        `${data.data.user_name} — almoço confirmado! (${data.data.meals_used}/${data.data.total_meals})`,
        'success'
      )
      setUsedToday(true)
      setVoucher((current) => (current ? { ...current, ...data.data } : current))
    } catch (error) {
      toast(
        error.response?.data?.msg || error.response?.data?.detail || 'Erro ao registrar refeição',
        'error'
      )
    } finally {
      setUsing(false)
    }
  }

  useEffect(
    () => () => {
      stopCamera()
    },
    [stopCamera]
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">
          Caixa · RU Sem Desperdício
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Voucher de evento</h1>
        <p className="text-ru-muted mt-2">
          Escaneie o QR do voucher de 5 almoços e confirme a refeição de hoje.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-6">
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Camera size={20} className="text-ru-blue" /> Leitor
            </h2>
            {cameraOn && (
              <button onClick={stopCamera} className="text-sm text-ru-muted hover:text-ru-charcoal">
                Fechar câmera
              </button>
            )}
          </div>
          <div className="relative mt-5 min-h-72 rounded-2xl bg-ru-charcoal overflow-hidden">
            <div id="evoucher-reader" className="voucher-reader" />
            {!cameraOn && (
              <div className="absolute inset-0 grid place-items-center">
                <button
                  onClick={startCamera}
                  className="bg-white text-ru-blue px-5 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
                >
                  <Camera size={18} /> Abrir câmera
                </button>
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-ru-cream-dark">
            <label
              className="font-display font-semibold flex items-center gap-2"
              htmlFor="evoucher-code"
            >
              <Keyboard size={18} className="text-ru-blue" /> Inserir código do QR
            </label>
            <p className="text-xs text-ru-muted mt-1">Use esta opção se a câmera não funcionar.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <input
                id="evoucher-code"
                className="input-field font-mono text-xs"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder='{"v":2,"id":1,…}'
              />
              <button
                className="btn-primary shrink-0"
                onClick={async () => {
                  try {
                    const p = parseQRData(manual.trim())
                    if (p.v !== 2) throw new Error('')
                    await loadVoucher(p)
                  } catch (error) {
                    toast(error.message || 'QR inválido', 'error')
                  }
                }}
                disabled={!manual.trim()}
              >
                Validar QR
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          {loading ? (
            <section className="card min-h-56 grid place-items-center">
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-ru-blue border-t-transparent" />
            </section>
          ) : voucher ? (
            <>
              <section className="card border-2 border-emerald-200 bg-emerald-50/50">
                <CheckCircle2 size={38} className="text-emerald-600" />
                <h2 className="font-display text-2xl font-bold mt-4">Voucher ativo</h2>
                <p className="font-semibold text-ru-charcoal mt-4 text-lg">{voucher.user_name}</p>
                <p className="font-mono text-xs text-ru-muted mt-1">{voucher.code}</p>
                <div className="flex items-center justify-center gap-4 mt-5">
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-ru-blue">
                      {voucher.meals_used}
                    </p>
                    <p className="text-xs text-ru-muted">usados</p>
                  </div>
                  <span className="text-ru-muted text-2xl">/</span>
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-ru-charcoal">
                      {voucher.total_meals}
                    </p>
                    <p className="text-xs text-ru-muted">total</p>
                  </div>
                </div>

                <button
                  className={`w-full mt-5 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    usedToday
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-ru-blue text-white hover:bg-ru-blue-dark'
                  }`}
                  onClick={useVoucher}
                  disabled={usedToday || using || voucher.meals_used >= voucher.total_meals}
                >
                  <UtensilsCrossed size={18} />
                  {using ? 'Registrando…' : usedToday ? 'Almoço já registrado hoje' : 'Comeu hoje!'}
                </button>
              </section>

              {voucher.usages?.length > 0 && (
                <section className="card">
                  <h3 className="font-display font-semibold flex items-center gap-2 text-ru-charcoal mb-3">
                    <History size={16} className="text-ru-blue" /> Histórico de refeições
                  </h3>
                  <div className="space-y-2">
                    {voucher.usages.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-xl bg-ru-cream px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <UtensilsCrossed size={14} className="text-ru-muted" />
                          {formatDate(u.meal_date)}
                        </span>
                        <span className="text-ru-muted">
                          {u.meal_type === 'lunch' ? 'Almoço' : 'Jantar'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="card min-h-56 grid place-items-center text-center">
              <div>
                <ScrollText size={34} className="mx-auto text-ru-muted" />
                <h2 className="font-display font-semibold mt-3">Aguardando leitura</h2>
                <p className="text-sm text-ru-muted mt-2">Escaneie o QR do voucher de evento.</p>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
