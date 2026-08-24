import { useState, useEffect } from 'react'
import { reportAPI, scheduleAPI, userAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend, PieChart, Pie,
} from 'recharts'
import {
  Download, RefreshCw, Users, UtensilsCrossed, TrendingUp,
  Star, Leaf, Crown, Brain, Sprout, AlertTriangle,
  Clock, CalendarDays, UserX, Activity,
} from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import { toBRDate } from '../../utils/helpers'

const AI_URL = 'https://desperdicio-ia.onrender.com'

const today = new Date()
const todayStr = today.toISOString().split('T')[0]

function formatShortDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

const TOOLTIP_STYLE = {
  fontFamily: 'DM Sans',
  borderRadius: 12,
  border: '1px solid #e2e8f5',
  boxShadow: 'none',
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [date, setDate] = useState(todayStr)
  const [demand, setDemand] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [forecast, setForecast] = useState([])
  const [forecastLoading, setForecastLoading] = useState(true)

  const [noshowSummary, setNoshowSummary] = useState(null)
  const [noshowLoading, setNoshowLoading] = useState(true)

  const [patterns, setPatterns] = useState(null)
  const [patternsLoading, setPatternsLoading] = useState(true)

  const [menuInsights, setMenuInsights] = useState(null)
  const [menuInsightsLoading, setMenuInsightsLoading] = useState(true)

  // Total de usuários cadastrados (novo)
  const [totalUsers, setTotalUsers] = useState(null)
  const [usersLoading, setUsersLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const brDate = toBRDate(date)
      const [schedulesRes, demandRes] = await Promise.all([
        scheduleAPI.allSchedules(brDate),
        reportAPI.demand(brDate),
      ])

      const raw = schedulesRes.data?.data || []
      setTotal(raw.length)

      const demandData = demandRes.data?.data
      if (demandData) {
        setDemand({
          almoco:      demandData.lunch        ?? 0,
          jantar:      demandData.dinner       ?? 0,
          select:      demandData.select       ?? 0,
          leve_sabor:  demandData.leve_sabor   ?? 0,
          essencial:   demandData.essencial    ?? 0,
          vegetariano: demandData.vegetariano  ?? 0,
        })
      } else {
        const almoco = raw.filter(s => s.schedule_type === 'lunch').length
        const jantar = raw.filter(s => s.schedule_type === 'dinner').length
        setDemand({ almoco, jantar, select: 0, leve_sabor: 0, essencial: 0, vegetariano: 0 })
      }
    } catch {
      toast('Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadTotalUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await userAPI.count()
      setTotalUsers(res.data?.total ?? null)
    } catch {
      setTotalUsers(null)
    } finally {
      setUsersLoading(false)
    }
  }

  const loadForecast = async () => {
    setForecastLoading(true)
    try {
      const res = await fetch(`${AI_URL}/api/demand/forecast?days=7`)
      const data = await res.json()
      setForecast(data.map(d => ({
        date: formatShortDate(d.date),
        Almoço: d.lunch,
        Jantar: d.dinner,
      })))
    } catch {
      setForecast([])
    } finally {
      setForecastLoading(false)
    }
  }

  const loadNoshowSummary = async () => {
    setNoshowLoading(true)
    try {
      const res = await fetch(`${AI_URL}/api/noshow/summary?date=${date}`)
      const data = await res.json()
      setNoshowSummary(data)
    } catch {
      setNoshowSummary(null)
    } finally {
      setNoshowLoading(false)
    }
  }

  const loadPatterns = async () => {
    setPatternsLoading(true)
    try {
      const res = await fetch(`${AI_URL}/api/patterns/weekly`)
      const data = await res.json()
      setPatterns(data)
    } catch {
      setPatterns(null)
    } finally {
      setPatternsLoading(false)
    }
  }

  const loadMenuInsights = async () => {
    setMenuInsightsLoading(true)
    try {
      const res = await fetch(`${AI_URL}/api/demand/menu-insights`)
      const data = await res.json()
      setMenuInsights(data)
    } catch {
      setMenuInsights(null)
    } finally {
      setMenuInsightsLoading(false)
    }
  }

  useEffect(() => { load() }, [date])
  useEffect(() => { loadNoshowSummary() }, [date])
  useEffect(() => { loadForecast(); loadPatterns(); loadMenuInsights(); loadTotalUsers() }, [])

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
        { name: 'Almoço',      value: demand.almoco      ?? 0, fill: '#1a3a8f' },
        { name: 'Jantar',      value: demand.jantar      ?? 0, fill: '#f5a623' },
        { name: 'Select',      value: demand.select      ?? 0, fill: '#7c3aed' },
        { name: 'Leve Sabor',  value: demand.leve_sabor  ?? 0, fill: '#059669' },
        { name: 'Essencial',   value: demand.essencial   ?? 0, fill: '#dc2626' },
        { name: 'Vegetariano', value: demand.vegetariano ?? 0, fill: '#16a34a' },
      ]
    : []

  const mealTypePieData = demand
    ? [
        { name: 'Select',      value: demand.select      ?? 0, fill: '#7c3aed' },
        { name: 'Leve Sabor',  value: demand.leve_sabor  ?? 0, fill: '#059669' },
        { name: 'Essencial',   value: demand.essencial   ?? 0, fill: '#dc2626' },
        { name: 'Vegetariano', value: demand.vegetariano ?? 0, fill: '#16a34a' },
      ].filter(d => d.value > 0)
    : []

  const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

  const StatCard = ({ icon: Icon, label, value, color = 'text-ru-blue', sub }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ru-muted font-body mb-1">{label}</p>
          <p className={`font-display font-bold text-2xl ${color}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-ru-muted font-body mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 bg-ru-cream rounded-xl flex items-center justify-center">
          <Icon size={18} className={color} />
        </div>
      </div>
    </div>
  )

  const SectionTitle = ({ icon: Icon, title, badge }) => (
    <div className="flex items-center gap-2 mb-5">
      <Icon size={18} className="text-ru-blue" />
      <h2 className="font-display font-semibold text-ru-charcoal">{title}</h2>
      {badge && (
        <span className="ml-auto text-xs font-body font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-ru-blue">
          {badge}
        </span>
      )}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">

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

      {/* Plataforma — visão geral */}
      <p className="text-xs text-ru-muted font-body font-semibold uppercase tracking-wide mb-2">Plataforma</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Usuários cadastrados"
          value={usersLoading ? '...' : (totalUsers ?? '—')}
          color="text-violet-600"
        />
        <StatCard
          icon={CalendarDays}
          label="Agendamentos hoje"
          value={total}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} className="text-ru-blue" />
        </div>
      ) : (
        <>
          <p className="text-xs text-ru-muted font-body font-semibold uppercase tracking-wide mb-2">Refeição</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard icon={Users}           label="Total no dia" value={total} />
            <StatCard icon={UtensilsCrossed} label="Almoços"      value={demand?.almoco ?? 0} />
            <StatCard icon={TrendingUp}      label="Jantares"     value={demand?.jantar ?? 0} />
          </div>

          <p className="text-xs text-ru-muted font-body font-semibold uppercase tracking-wide mb-2">Tipo de refeição</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Crown}   label="Select"      value={demand?.select      ?? 0} color="text-violet-600" />
            <StatCard icon={Leaf}    label="Leve Sabor"  value={demand?.leve_sabor  ?? 0} color="text-emerald-600" />
            <StatCard icon={Star}    label="Essencial"   value={demand?.essencial   ?? 0} color="text-red-600" />
            <StatCard icon={Sprout}  label="Vegetariano" value={demand?.vegetariano ?? 0} color="text-green-700" />
          </div>

          <div className="card mb-6">
            <SectionTitle icon={Activity} title={`Demanda por refeição — ${toBRDate(date)}`} />
            {chartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barCategoryGap="40%">
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f4f6fb' }} />
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

          {mealTypePieData.length > 0 && (
            <div className="card mb-6">
              <SectionTitle icon={UtensilsCrossed} title="Distribuição por tipo de refeição" />
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={mealTypePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {mealTypePieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 min-w-max">
                  {mealTypePieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                      <p className="text-sm font-body text-ru-charcoal">{d.name}</p>
                      <p className="text-sm font-body font-semibold text-ru-charcoal ml-auto pl-4">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-2 mb-4 mt-2">
        <Brain size={16} className="text-ru-blue" />
        <p className="text-xs text-ru-blue font-body font-semibold uppercase tracking-wide">Inteligência Artificial</p>
      </div>

      <div className="card mb-6">
        <SectionTitle icon={CalendarDays} title="Previsão de demanda — próximos 7 dias" badge="IA" />
        {forecastLoading ? (
          <div className="flex justify-center py-8"><Spinner size={24} className="text-ru-blue" /></div>
        ) : forecast.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={forecast}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#6b7280' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Line type="monotone" dataKey="Almoço" stroke="#1a3a8f" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Jantar" stroke="#f5a623" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-ru-muted font-body text-sm">
            Dados insuficientes para previsão. Aguarde mais agendamentos.
          </div>
        )}
      </div>

      <div className="card mb-6">
        <SectionTitle icon={UserX} title={`Risco de no-show — ${toBRDate(date)}`} badge="IA" />
        {noshowLoading ? (
          <div className="flex justify-center py-8"><Spinner size={24} className="text-ru-blue" /></div>
        ) : noshowSummary ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={15} className="text-red-500" />
                <p className="text-xs font-body font-semibold text-red-600 uppercase tracking-wide">Alto risco</p>
              </div>
              <p className="font-display font-bold text-3xl text-red-600">
                {noshowSummary.high_risk_count ?? '—'}
              </p>
              <p className="text-xs text-red-400 font-body mt-0.5">agendamentos com risco elevado</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={15} className="text-emerald-600" />
                <p className="text-xs font-body font-semibold text-emerald-700 uppercase tracking-wide">Presença esperada</p>
              </div>
              <p className="font-display font-bold text-3xl text-emerald-700">
                {noshowSummary.expected_attendance ?? '—'}
              </p>
              <p className="text-xs text-emerald-500 font-body mt-0.5">refeições a preparar</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-ru-muted font-body text-sm">
            Sem dados de no-show disponíveis para essa data.
          </div>
        )}
      </div>

      <div className="card mb-6">
        <SectionTitle icon={UtensilsCrossed} title="Impacto do cardápio na demanda" badge="IA" />
        {menuInsightsLoading ? (
          <div className="flex justify-center py-8"><Spinner size={24} className="text-ru-blue" /></div>
        ) : menuInsights?.available ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(menuInsights.insights).map(([ingredient, data]) => (
                <div key={ingredient} className="bg-ru-cream rounded-xl p-3">
                  <p className="text-xs text-ru-muted font-body capitalize mb-1">{ingredient}</p>
                  <p className={`font-display font-bold text-lg ${data.impact_pct > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {data.impact_pct > 0 ? '+' : ''}{data.impact_pct}%
                  </p>
                  <p className="text-xs text-ru-muted font-body">
                    {data.avg_demand_with} vs {data.avg_demand_without} refeições
                  </p>
                </div>
              ))}
            </div>
            {menuInsights.suggestion && (
              <div className="bg-ru-blue/5 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-xs text-ru-muted font-body">Sugestão estratégica</p>
                  <p className="font-body text-sm text-ru-charcoal">{menuInsights.suggestion}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-ru-muted font-body">
              Baseado em {menuInsights.total_days_analyzed} dias analisados.
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-ru-muted font-body text-sm">
            {menuInsights?.message || 'Dados insuficientes. Aguarde mais cardápios publicados e agendamentos.'}
          </div>
        )}
      </div>

      <div className="card mb-6">
        <SectionTitle icon={Clock} title="Padrões semanais" badge="IA" />
        {patternsLoading ? (
          <div className="flex justify-center py-8"><Spinner size={24} className="text-ru-blue" /></div>
        ) : patterns ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ru-cream rounded-xl p-4">
                <p className="text-xs text-ru-muted font-body mb-1">Dia mais movimentado</p>
                <p className="font-display font-bold text-lg text-ru-charcoal capitalize">
                  {patterns.busiest_day
                    ? WEEK_DAYS[patterns.busiest_day] ?? patterns.busiest_day
                    : '—'}
                </p>
              </div>
              <div className="bg-ru-cream rounded-xl p-4">
                <p className="text-xs text-ru-muted font-body mb-1">Horário de pico</p>
                <p className="font-display font-bold text-lg text-ru-charcoal">
                  {patterns.peak_hour ?? '—'}
                </p>
              </div>
            </div>

            {patterns.noshow_by_day && (
              <div>
                <p className="text-xs text-ru-muted font-body font-semibold uppercase tracking-wide mb-3">
                  Taxa de no-show por dia da semana
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={Object.entries(patterns.noshow_by_day).map(([day, rate]) => ({
                      day: WEEK_DAYS[Number(day)] ?? day,
                      'No-show %': +(rate * 100).toFixed(1),
                    }))}
                    barCategoryGap="35%"
                  >
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#6b7280' }} unit="%" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f4f6fb' }} formatter={(v) => [`${v}%`, 'No-show']} />
                    <Bar dataKey="No-show %" radius={[6, 6, 0, 0]} fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {patterns.most_popular_meal && (
              <div className="bg-ru-blue/5 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs text-ru-muted font-body">Refeição mais popular</p>
                  <p className="font-display font-semibold text-ru-charcoal capitalize">
                    {patterns.most_popular_meal}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-ru-muted font-body text-sm">
            Dados de padrões não disponíveis.
          </div>
        )}
      </div>

    </div>
  )
}
