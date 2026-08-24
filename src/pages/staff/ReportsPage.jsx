import { useState, useEffect } from 'react'
import { reportAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import { localISODate } from '../../utils/helpers'

// Gera últimos 7 dias para seleção rápida
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return localISODate(d)
  })
}

export default function ReportsPage() {
  const [weekData, setWeekData] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(localISODate)
  const { toast } = useToast()

  useEffect(() => {
    const days = lastNDays(7)
    Promise.all(
      days.map((d) =>
        reportAPI
          .demand(d)
          .then((r) => ({ date: d, ...r.data }))
          .catch(() => ({ date: d, almoco: 0, jantar: 0 }))
      )
    )
      .then((results) => {
        setWeekData(
          results.map((r) => ({
            date: r.date.slice(5).replace('-', '/'),
            Almoço: r.almoco ?? 0,
            Jantar: r.jantar ?? 0,
          }))
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await reportAPI.export(selectedDate)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-ru-${selectedDate}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast('Relatório exportado! 📊')
    } catch {
      toast('Erro ao exportar', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ru-charcoal">Relatórios</h1>
          <p className="text-ru-muted font-body text-sm mt-1">Demanda dos últimos 7 dias</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-auto text-sm py-2"
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            {exporting ? <Spinner size={14} /> : <Download size={14} />}
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-display font-semibold text-ru-charcoal mb-6">
          Almoço vs Jantar — últimos 7 dias
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} className="text-ru-blue" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weekData}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: 'DM Sans',
                  borderRadius: 12,
                  border: '1px solid #e8e0d0',
                  boxShadow: 'none',
                }}
              />
              <Legend wrapperStyle={{ fontFamily: 'DM Sans', fontSize: 13 }} />
              <Line
                type="monotone"
                dataKey="Almoço"
                stroke="#1a3a8f"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#1a3a8f' }}
              />
              <Line
                type="monotone"
                dataKey="Jantar"
                stroke="#f5a623"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f5a623' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legenda de cores */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {[
          { label: 'Almoço', color: 'bg-ru-blue', note: '11h – 14h' },
          { label: 'Jantar', color: 'bg-ru-yellow', note: '17h – 20h' },
        ].map((m) => (
          <div key={m.label} className="card flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${m.color}`} />
            <div>
              <p className="font-body font-medium text-ru-charcoal text-sm">{m.label}</p>
              <p className="text-xs text-ru-muted">{m.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
