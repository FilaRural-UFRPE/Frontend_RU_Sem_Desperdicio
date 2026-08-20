import { useState, useRef } from 'react'
import { useToast } from '../../contexts/ToastContext'
import Spinner from '../../components/ui/Spinner'
import { UploadCloud, ImageIcon, CheckCircle, Brain } from 'lucide-react'
import axios from 'axios'

const ADMIN_API_KEY   = import.meta.env.VITE_ADMIN_API_KEY
const MENU_ANALYZER_URL = import.meta.env.VITE_MENU_ANALYZER_URL || 'https://smartru-menu-analyzer.onrender.com'

async function uploadMenu(lunchFile, dinnerFile) {
  const formData = new FormData()
  formData.append('file', lunchFile)
  if (dinnerFile) formData.append('dinner_file', dinnerFile)

  const response = await axios.post(
    'https://semdesperdicio.smartru.com.br/api/menu/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${ADMIN_API_KEY}`,
      },
    }
  )
  return response.data
}

async function analyzeMenu(menuId, lunchFile, dinnerFile) {
  const formData = new FormData()
  formData.append('menu_id', menuId)
  formData.append('lunch_file', lunchFile)
  if (dinnerFile) formData.append('dinner_file', dinnerFile)

  const response = await axios.post(
    `${MENU_ANALYZER_URL}/analyze/both?menu_id=${menuId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
}

function DropZone({ label, emoji, file, preview, inputRef, onChange, onDrop, onRemove }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-display font-semibold text-ru-charcoal text-sm">
        {emoji} {label}
      </p>
      <div
        className="card border-2 border-dashed border-ru-cream-dark hover:border-ru-blue transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={onChange}
        />
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt={`Preview ${label}`}
              className="w-full max-h-64 object-contain rounded-xl"
            />
            <p className="text-ru-muted font-body text-xs">{file?.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <ImageIcon size={36} className="text-ru-muted opacity-30" />
            <p className="font-display font-semibold text-ru-charcoal text-sm">Arrasta a imagem aqui</p>
            <p className="text-ru-muted font-body text-xs">ou clica para selecionar · PNG ou JPG · máx 10MB</p>
          </div>
        )}
      </div>
      {preview && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="btn-secondary px-4 py-1.5 text-xs self-start"
        >
          Remover
        </button>
      )}
    </div>
  )
}

export default function MenuUploadPage() {
  const [lunchFile, setLunchFile]     = useState(null)
  const [lunchPreview, setLunchPreview] = useState(null)
  const [dinnerFile, setDinnerFile]   = useState(null)
  const [dinnerPreview, setDinnerPreview] = useState(null)
  const [loading, setLoading]         = useState(false)
  const [analyzingAI, setAnalyzingAI] = useState(false)
  const [publishedLunch, setPublishedLunch]   = useState(null)
  const [publishedDinner, setPublishedDinner] = useState(null)
  const [extractedDishes, setExtractedDishes] = useState(null)

  const lunchRef  = useRef(null)
  const dinnerRef = useRef(null)
  const { toast } = useToast()

  const handleFile = (setFile, setPreview) => (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const handleDrop = (setFile, setPreview) => (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    setFile(dropped)
    setPreview(URL.createObjectURL(dropped))
  }

  const handleSubmit = async () => {
    if (!lunchFile) {
      toast('Seleciona a imagem do almoço primeiro', 'error')
      return
    }
    setLoading(true)
    try {
      // 1. Publica o cardápio no backend SmartRU
      const uploadResult = await uploadMenu(lunchFile, dinnerFile)
      const menuId = uploadResult?.data?.id

      setPublishedLunch(lunchPreview)
      setPublishedDinner(dinnerPreview)
      toast('Cardápio publicado com sucesso!', 'success')

      // Limpa campos de upload
      setLunchFile(null)
      setLunchPreview(null)
      setDinnerFile(null)
      setDinnerPreview(null)

      // 2. Analisa automaticamente com a IA (em background)
      if (menuId) {
        setAnalyzingAI(true)
        try {
          const aiResult = await analyzeMenu(menuId, lunchFile, dinnerFile)
          setExtractedDishes(aiResult?.results)
          toast('IA extraiu os pratos do cardápio! 🤖', 'success')
        } catch {
          toast('Cardápio publicado, mas a IA não conseguiu extrair os pratos.', 'warning')
        } finally {
          setAnalyzingAI(false)
        }
      }

    } catch (err) {
      if (err.response?.status === 401) {
        toast('Sem permissão para fazer upload', 'error')
      } else if (err.response?.status === 400) {
        toast('Ficheiro inválido. Use PNG ou JPG até 10MB.', 'error')
      } else {
        toast('Erro ao publicar cardápio. Tenta novamente.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-ru-charcoal">Publicar Cardápio</h1>
        <p className="text-ru-muted font-body text-sm mt-1">
          Faz upload das imagens do cardápio da semana
        </p>
      </div>

      {/* Campos de upload */}
      <div className="flex flex-col gap-6">
        <DropZone
          label="Almoço"
          emoji="🍽"
          file={lunchFile}
          preview={lunchPreview}
          inputRef={lunchRef}
          onChange={handleFile(setLunchFile, setLunchPreview)}
          onDrop={handleDrop(setLunchFile, setLunchPreview)}
          onRemove={() => { setLunchFile(null); setLunchPreview(null) }}
        />
        <DropZone
          label="Jantar (opcional)"
          emoji="🌙"
          file={dinnerFile}
          preview={dinnerPreview}
          inputRef={dinnerRef}
          onChange={handleFile(setDinnerFile, setDinnerPreview)}
          onDrop={handleDrop(setDinnerFile, setDinnerPreview)}
          onRemove={() => { setDinnerFile(null); setDinnerPreview(null) }}
        />
      </div>

      {/* Botão publicar */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleSubmit}
          disabled={!lunchFile || loading || analyzingAI}
          className="btn-primary flex items-center gap-2 px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Spinner size={14} /> A publicar...</>
          ) : (
            <><UploadCloud size={16} /> Publicar cardápio</>
          )}
        </button>

        {/* Estado da análise IA */}
        {analyzingAI && (
          <div className="flex items-center gap-2 text-ru-blue font-body text-sm">
            <Spinner size={14} className="text-ru-blue" />
            <Brain size={15} />
            IA a extrair pratos do cardápio...
          </div>
        )}
      </div>

      {/* Confirmação visual após publicação */}
      {(publishedLunch || publishedDinner) && (
        <div className="mt-10 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            <p className="font-display font-semibold text-green-700 text-sm">
              Cardápio publicado — visualização abaixo
            </p>
          </div>

          {publishedLunch && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-ru-blue/5 border-b border-ru-cream-dark">
                <p className="font-display font-semibold text-ru-blue text-sm">🍽 Almoço</p>
              </div>
              <img src={publishedLunch} alt="Cardápio do almoço" className="w-full object-contain max-h-[60vh]" />
            </div>
          )}

          {publishedDinner && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-ru-blue/5 border-b border-ru-cream-dark">
                <p className="font-display font-semibold text-ru-blue text-sm">🌙 Jantar</p>
              </div>
              <img src={publishedDinner} alt="Cardápio do jantar" className="w-full object-contain max-h-[60vh]" />
            </div>
          )}

          {/* Pratos extraídos pela IA */}
          {extractedDishes && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={18} className="text-ru-blue" />
                <p className="font-display font-semibold text-ru-charcoal text-sm">Pratos extraídos pela IA</p>
              </div>

              {extractedDishes.lunch?.dishes && (
                <div className="mb-4">
                  <p className="text-xs font-body font-semibold text-ru-muted uppercase tracking-wide mb-2">🍽 Almoço</p>
                  {Object.entries(extractedDishes.lunch.dishes.dishes || extractedDishes.lunch.dishes).map(([key, items]) => (
                    items && items.length > 0 && (
                      <div key={key} className="mb-1">
                        <span className="text-xs text-ru-muted font-body capitalize">{key.replace('_', ' ')}: </span>
                        <span className="text-xs text-ru-charcoal font-body">{items.join(', ')}</span>
                      </div>
                    )
                  ))}
                </div>
              )}

              {extractedDishes.dinner?.dishes && (
                <div>
                  <p className="text-xs font-body font-semibold text-ru-muted uppercase tracking-wide mb-2">🌙 Jantar</p>
                  {Object.entries(extractedDishes.dinner.dishes.dishes || extractedDishes.dinner.dishes).map(([key, items]) => (
                    items && items.length > 0 && (
                      <div key={key} className="mb-1">
                        <span className="text-xs text-ru-muted font-body capitalize">{key.replace('_', ' ')}: </span>
                        <span className="text-xs text-ru-charcoal font-body">{items.join(', ')}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
