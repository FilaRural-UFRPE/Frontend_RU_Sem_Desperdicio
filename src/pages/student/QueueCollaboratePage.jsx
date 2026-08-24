import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Award, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import Spinner from '../../components/ui/Spinner'

import entradaPhoto from '../../assets/queue-points/entrada.jpg'
import arvorePhoto from '../../assets/queue-points/arvore.jpg'
import escadasPhoto from '../../assets/queue-points/escadas.jpg'
import bancosJangoPhoto from '../../assets/queue-points/bancos-jango.jpg'

// Base da API do filarural-backend. Pode ser sobrescrita via VITE_FILARURAL_API_URL;
// por padrao usa a mesma instancia ja hospedada em producao no Render.
const FILARURAL_API_BASE =
  (import.meta.env.VITE_FILARURAL_API_URL || 'https://filarural-backend.onrender.com/api').replace(/\/$/, '')

// Precisa bater exatamente com a whitelist do backend (services/location.py -> PONTOS_METROS).
const REFERENCE_POINTS = [
  { value: 'entrada', label: 'Entrada do RU', photo: entradaPhoto },
  { value: 'arvore', label: 'Árvore', photo: arvorePhoto },
  { value: 'escadas', label: 'Escadas', photo: escadasPhoto },
  { value: 'bancos jango', label: 'Bancos do Jango', photo: bancosJangoPhoto },
]

// reporter_key precisa ter entre 8 e 128 caracteres (REQ-10, rate limit por colaborador).
// Gerado uma vez por dispositivo e reaproveitado, para o limite de 1 reporte por janela funcionar.
function getReporterKey() {
  const stored = localStorage.getItem('smartru_reporter_key')
  if (stored) return stored
  const key =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `reporter-${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem('smartru_reporter_key', key)
  return key
}

export default function QueueCollaboratePage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [selectedPoint, setSelectedPoint] = useState(null)
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(true)
  const [locationError, setLocationError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { reward, queue_state } após sucesso

  const requestLocation = useCallback(() => {
    setLocating(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Seu navegador não suporta geolocalização.')
      setLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocating(false)
      },
      (error) => {
        const messages = {
          1: 'Permissão de localização negada. Ative nas configurações do navegador.',
          2: 'Não foi possível obter sua localização agora.',
          3: 'A busca por localização demorou demais. Tente de novo.',
        }
        setLocationError(messages[error.code] || 'Erro ao obter localização.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const handleSubmit = async () => {
    if (!selectedPoint || !coords) return

    setSubmitting(true)
    try {
      const res = await fetch(`${FILARURAL_API_BASE}/queue/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          reference_point: selectedPoint,
          reporter_key: getReporterKey(),
          name: user?.name || null,
          email: user?.email || null,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = data?.detail || 'Não foi possível registrar sua colaboração.'
        toast(detail, res.status === 429 ? 'warning' : 'error')
        setSubmitting(false)
        return
      }

      setResult(data)
      toast('Obrigado por colaborar com a fila do RU!', 'success')
    } catch {
      toast('Erro de conexão. Tente novamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h1 className="font-display font-bold text-xl text-ru-charcoal mb-2">
          Colaboração registrada!
        </h1>
        <p className="text-ru-muted font-body text-sm mb-6">
          Obrigado por ajudar a manter a fila do RU atualizada para todo mundo.
        </p>

        {result.reward && (
          <div className="card bg-ru-yellow/10 border-0 mb-6 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-ru-yellow-dark" />
              <p className="font-display font-semibold text-ru-charcoal text-sm">Sua recompensa</p>
            </div>
            <p className="text-sm font-body text-ru-charcoal">
              +{result.reward.points ?? 0} pontos
              {result.reward.badge ? ` · ${result.reward.badge}` : ''}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link to="/dashboard" className="btn-primary w-full text-center">
            Voltar ao início
          </Link>
          <button
            onClick={() => {
              setResult(null)
              setSelectedPoint(null)
              requestLocation()
            }}
            className="text-sm text-ru-blue font-body hover:underline"
          >
            Reportar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-ru-muted font-body mb-4 hover:text-ru-charcoal">
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <h1 className="font-display font-bold text-xl text-ru-charcoal mb-1">
        Colaborar com a fila
      </h1>
      <p className="text-ru-muted font-body text-sm mb-6">
        Nos diga onde você está na fila agora e ajude outros estudantes a se planejarem.
      </p>

      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-ru-blue" />
          <p className="font-display font-semibold text-ru-charcoal text-sm">Sua localização</p>
        </div>

        {locating && (
          <div className="flex items-center gap-2 text-ru-muted text-sm font-body">
            <Spinner size={16} />
            Obtendo sua localização...
          </div>
        )}

        {!locating && locationError && (
          <div>
            <p className="flex items-start gap-2 text-sm text-red-600 font-body mb-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              {locationError}
            </p>
            <button onClick={requestLocation} className="text-sm text-ru-blue font-body hover:underline">
              Tentar novamente
            </button>
          </div>
        )}

        {!locating && !locationError && coords && (
          <p className="flex items-center gap-2 text-sm text-emerald-700 font-body">
            <CheckCircle size={14} />
            Localização obtida com sucesso
          </p>
        )}
      </div>

      <div className="card mb-6">
        <p className="font-display font-semibold text-ru-charcoal text-sm mb-3">
          Onde você está na fila?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {REFERENCE_POINTS.map((point) => (
            <button
              key={point.value}
              onClick={() => setSelectedPoint(point.value)}
              className={`rounded-xl border-2 overflow-hidden text-left transition-colors ${
                selectedPoint === point.value
                  ? 'border-ru-blue'
                  : 'border-ru-cream-dark hover:border-ru-blue/40'
              }`}
            >
              <div className="aspect-video w-full overflow-hidden bg-ru-cream">
                <img src={point.photo} alt={point.label} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-body font-medium text-ru-charcoal px-3 py-2">{point.label}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedPoint || !coords || submitting}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? <Spinner size={16} /> : null}
        {submitting ? 'Enviando...' : 'Confirmar colaboração'}
      </button>

      <p className="text-xs text-ru-muted font-body text-center mt-3">
        Você precisa estar próximo ao RU (até 100m) para colaborar.
      </p>
    </div>
  )
}
