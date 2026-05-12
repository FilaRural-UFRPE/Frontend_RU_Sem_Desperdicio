import { useState, useEffect } from 'react'
import { reportAPI, scheduleAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Download, RefreshCw, Users, UtensilsCrossed, TrendingUp } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'

const today = new Date()
const todayStr = today.toISOString().split('T')[0]

// Converte YYYY-MM-DD para DD/MM/YYYY
function toBRDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [date, setDate] = useState(todayStr)
  const [demand, setDemand] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const brDate = toBRDate(date)
      console.log('date:', date)
    console.log('brDate:', brDate)

      // Busca agendamentos do dia e demanda ao mesmo tempo
      const [schedulesRes, demandRes] = await Promise.all([
        scheduleAPI.allSchedules(brDate),
        reportAPI.demand(brDate),
      ])

      // Agendamentos
      const raw = schedulesRes.data?.data || []
      setTotal(raw.length)

      // Demanda do relatório
      const demandData = demandRes.data?.data
      if (demandData) {
        setDemand({
          almoco: demandData.lunch ?? 0,
          jantar: demandData.dinner ?? 0,
        })
      } else {
        // Fallback: conta pelos agendamentos
        const almoco = raw.filter(s => s.schedule_type === 'lunch').length
        const jantar = raw.filter(s => s.schedule_type === 'dinner').length
        setDemand({ almoco, jantar })
      }

    } catch {
      toast('Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [date])

  const handleExport = async () => {
    setExporting(true)
    try {
      const brDate = toBRDate(date)
      const res = await reportAPI.export(brDate)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-ru-${date}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast('Relatório exportado! 📊')
    } catch {
      toast('Erro ao exportar relatório', 'error')
    } finally {
      setExporting(false)
    }
  }

  const chartData = demand
    ? [
        { name: 'Almoço', value: demand.almoco ?? 0, fill: '#1a3a8f' },
        { name: 'Jantar', value: demand.jantar ?? 0, fill: '#f5a623' },
      ]
    : []

  const StatCard = ({ icon: Icon, label, value }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ru-muted font-body mb-1">{label}</p>
          <p className="font-display font-bold text-2xl text-ru-blue">{value ?? '—'}</p>
        </div>
        <div className="w-10 h-10 bg-ru-cream rounded-xl flex items-center justify-center">
          <Icon size={18} className="text-ru-blue" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-ru-muted font-body text-sm">Olá, {user?.name?.split(' ')[0]} 👋</p>
          <h1 className="font-display font-bold text-2xl text-ru-charcoal">Painel do RU</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-auto text-sm py-2"
          />
          <button onClick={load} className="btn-secondary px-3 py-2 text-sm flex items-center gap-2">
            <RefreshCw size={14} />
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            {exporting ? <Spinner size={14} /> : <Download size={14} />}
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} className="text-ru-blue" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard icon={Users} label="Total no dia" value={total} />
            <StatCard icon={UtensilsCrossed} label="Almoços" value={demand?.almoco ?? 0} />
            <StatCard icon={TrendingUp} label="Jantares" value={demand?.jantar ?? 0} />
          </div>

          {/* Gráfico */}
          <div className="card mb-6">
            <h2 className="font-display font-semibold text-ru-charcoal mb-5">
              Demanda por refeição — {toBRDate(date)}
            </h2>
            {chartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barCategoryGap="40%">
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontFamily: 'DM Sans', fontSize: 13, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ fontFamily: 'DM Sans', borderRadius: 12, border: '1px solid #e2e8f5', boxShadow: 'none' }}
                    cursor={{ fill: '#f4f6fb' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-ru-muted font-body text-sm">
                Sem agendamentos para esse dia
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}