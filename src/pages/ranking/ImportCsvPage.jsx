import { useRef, useState } from 'react'
import { UploadCloud, Download, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react'
import { rankingAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

const fmt = (d) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
const EXAMPLE_TODAY = fmt(new Date())
const EXAMPLE_YESTERDAY = fmt(new Date(Date.now() - 86400000))

export default function ImportCsvPage() {
  const { toast } = useToast()
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const downloadTemplate = () => {
    const csv = `cpf,date,meal_type\n72053816490,${EXAMPLE_TODAY},lunch\n72053816490,${EXAMPLE_YESTERDAY},dinner\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-presencas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const submit = async () => {
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const { data } = await rankingAPI.importCsv(file)
      setResult(data)
      toast(`${data.accepted} presença(s) registrada(s)`, 'success')
    } catch (error) {
      toast(
        error.response?.data?.detail?.msg ||
          error.response?.data?.msg ||
          'Não foi possível importar o CSV',
        'error'
      )
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
      setFile(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">
          Secretaria · Comparecimento ao RU
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Importar presenças</h1>
        <p className="text-ru-muted mt-2">
          Envie o CSV da secretaria com os comparecimentos do dia. O ranking é atualizado na hora.
        </p>
      </header>

      <section className="card">
        <div className="flex items-center gap-2 text-sm mb-4">
          <FileSpreadsheet size={18} className="text-ru-blue" />
          <span className="font-display font-semibold">Formato esperado</span>
        </div>
        <pre className="bg-ru-charcoal text-green-100 text-xs rounded-xl p-4 overflow-x-auto font-mono">{`cpf,date,meal_type\n72053816490,${EXAMPLE_TODAY},lunch\n72053816490,${EXAMPLE_YESTERDAY},dinner`}</pre>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={downloadTemplate}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Download size={16} /> Baixar modelo
          </button>
        </div>
        <ul className="mt-4 text-xs text-ru-muted space-y-1">
          <li>
            · Colunas: <code className="font-mono">cpf</code>,{' '}
            <code className="font-mono">date</code> (DD/MM/AAAA) e{' '}
            <code className="font-mono">meal_type</code> (lunch/almoco, dinner/jantar)
          </li>
          <li>· CPFs não cadastrados e datas inválidas são ignorados com aviso</li>
          <li>· Presenças já confirmadas não são duplicadas</li>
        </ul>
      </section>

      <section className="card">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <label
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-8 px-4 cursor-pointer transition-colors ${file ? 'border-emerald-400 bg-emerald-50/50' : 'border-ru-cream-dark hover:border-ru-blue'}`}
          >
            <UploadCloud size={28} className={file ? 'text-emerald-500' : 'text-ru-muted'} />
            <p className="font-display font-semibold mt-3">
              {file ? file.name : 'Selecionar arquivo CSV'}
            </p>
            <p className="text-xs text-ru-muted mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'ou arraste e solte aqui'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <button
          onClick={submit}
          disabled={!file || busy}
          className="btn-primary w-full mt-4 inline-flex justify-center items-center gap-2 disabled:opacity-50"
        >
          <UploadCloud size={18} /> {busy ? 'Importando…' : 'Importar presenças'}
        </button>
      </section>

      {result && (
        <section className="card">
          <h2 className="font-display text-lg font-semibold mb-4">Resultado do import</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <CheckCircle2 size={22} className="mx-auto text-emerald-600" />
              <p className="font-display text-3xl font-bold text-emerald-600 mt-2">
                {result.accepted}
              </p>
              <p className="text-xs text-ru-muted mt-1">Presenças registradas</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <AlertTriangle size={22} className="mx-auto text-amber-500" />
              <p className="font-display text-3xl font-bold text-amber-600 mt-2">
                {result.rejected}
              </p>
              <p className="text-xs text-ru-muted mt-1">Linhas ignoradas</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-ru-muted uppercase tracking-wide mb-2">
                Detalhes das linhas ignoradas
              </p>
              <div className="max-h-48 overflow-y-auto rounded-xl bg-ru-cream/60 divide-y divide-ru-cream-dark">
                {result.errors.map((err, i) => (
                  <div key={i} className="px-4 py-2 text-xs">
                    <span className="text-red-500 font-medium">{err.reason}</span>
                    {err.line != null && (
                      <span className="text-ru-muted ml-2 font-mono">Linha {err.line}</span>
                    )}
                    {err.row != null && (
                      <span className="text-ru-muted ml-2 font-mono">
                        {JSON.stringify(err.row)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
