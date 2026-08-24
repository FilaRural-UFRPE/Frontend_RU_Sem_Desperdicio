import { useCallback, useEffect, useState } from 'react'
import {
  Bell, CheckCircle2, Mail, Megaphone, Pencil, Send, Trash2, AlertTriangle, Clock,
} from 'lucide-react'
import { announcementAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const formatDate = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'

export default function AnnouncementsPage() {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal', send_now: true })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await announcementAPI.list()
      setAnnouncements(data.data || [])
    } catch (error) {
      toast(error.response?.data?.detail?.msg || 'Erro ao carregar avisos', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', message: '', priority: 'normal', send_now: true })
    setShowModal(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({ title: a.title, message: a.message, priority: a.priority, send_now: false })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast('Preencha o assunto e o corpo do aviso', 'error'); return }
    setSaving(true)
    try {
      const payload = { title: form.title.trim(), message: form.message.trim(), priority: form.priority }
      const { data } = editing
        ? await announcementAPI.update(editing.id, payload)
        : await announcementAPI.create(payload)
      if (!data.success) { toast(data.msg, 'error'); return }

      if (form.send_now) {
        const id = editing ? editing.id : data.data?.id
        await announcementAPI.notify(id)
        toast('Aviso publicado e enviado por e-mail aos cadastrados!', 'success')
      } else {
        toast('Aviso salvo', 'success')
      }
      setShowModal(false)
      load()
    } catch (error) {
      toast(error.response?.data?.detail?.msg || error.response?.data?.msg || 'Erro ao salvar aviso', 'error')
    } finally {
      setSaving(false)
    }
  }

  const notify = async (id) => {
    if (!window.confirm('Enviar este aviso por e-mail para todos os usuários cadastrados?')) return
    setSending(id)
    try {
      const { data } = await announcementAPI.notify(id)
      toast(`Aviso enviado por e-mail (job #${data.job_id})`, 'success')
    } catch (error) {
      toast(error.response?.data?.detail?.msg || 'Erro ao enviar aviso', 'error')
    } finally {
      setSending(null)
    }
  }

  const toggleActive = async (a) => {
    try {
      await announcementAPI.update(a.id, { is_active: !a.is_active })
      toast(a.is_active ? 'Aviso desativado' : 'Aviso ativado', 'success')
      load()
    } catch (error) {
      toast(error.response?.data?.detail?.msg || 'Erro ao atualizar aviso', 'error')
    }
  }

  const remove = async (a) => {
    if (!window.confirm(`Excluir o aviso "${a.title}"?`)) return
    try {
      await announcementAPI.remove(a.id)
      toast('Aviso removido', 'success')
      load()
    } catch (error) {
      toast(error.response?.data?.detail?.msg || 'Erro ao excluir aviso', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ru-blue">Admin · Comunicados</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ru-charcoal mt-2">Avisos</h1>
          <p className="text-ru-muted mt-2">
            Publique avisos e dispare um e-mail para todos os cadastrados — útil para imprevistos como término da comida ou fechamento do RU.
          </p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={openCreate}>
          <Megaphone size={17} /> Criar aviso
        </button>
      </header>

      {loading ? (
        <div className="card flex items-center justify-center py-20"><Spinner size={28} /></div>
      ) : announcements.length === 0 ? (
        <section className="card text-center py-16">
          <Bell className="mx-auto text-ru-muted" size={38} />
          <h2 className="font-display font-semibold text-xl mt-4">Nenhum aviso ainda</h2>
          <p className="text-ru-muted text-sm mt-2">Clique em "Criar aviso" para redigir o assunto e o corpo do comunicado.</p>
        </section>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className={`card ${a.is_active ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold text-ru-charcoal">{a.title}</h3>
                    <span className={`tag ${a.priority === 'urgente' ? 'bg-red-50 text-red-600' : 'bg-ru-cream text-ru-muted'}`}>
                      {a.priority === 'urgente' ? <AlertTriangle size={12} /> : null}
                      {a.priority === 'urgente' ? 'Urgente' : 'Normal'}
                    </span>
                    {!a.is_active && <span className="tag bg-gray-100 text-gray-500">Inativo</span>}
                  </div>
                  <p className="text-sm text-ru-muted mt-2 whitespace-pre-line">{a.message}</p>
                  <p className="flex items-center gap-1.5 text-xs text-ru-muted mt-3">
                    <Clock size={13} /> {formatDate(a.published_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5" onClick={() => notify(a.id)} disabled={sending === a.id || !a.is_active}>
                    <Send size={14} /> {sending === a.id ? 'Enviando...' : 'Enviar e-mail'}
                  </button>
                  <button className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5" onClick={() => openEdit(a)}>
                    <Pencil size={14} /> Editar
                  </button>
                  <button className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5" onClick={() => toggleActive(a)}>
                    <CheckCircle2 size={14} /> {a.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button className="btn-danger px-3 py-2 text-xs inline-flex items-center gap-1.5" onClick={() => remove(a)}>
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal open onClose={() => setShowModal(false)} title={editing ? 'Editar aviso' : 'Novo aviso'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ru-charcoal mb-1">Assunto (título do e-mail)</label>
              <input className="input-field" maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: RU fechado hoje à noite" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ru-charcoal mb-1">Corpo da mensagem</label>
              <textarea className="input-field min-h-32" maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Detalhe a mensagem que será enviada aos usuários..." />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-ru-charcoal mb-1">Prioridade</label>
                <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              {!editing && (
                <label className="flex-1 flex items-center gap-2 mt-6 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 accent-ru-blue" checked={form.send_now} onChange={(e) => setForm({ ...form, send_now: e.target.checked })} />
                  <span className="text-sm text-ru-charcoal inline-flex items-center gap-1.5"><Mail size={15} /> Enviar por e-mail agora</span>
                </label>
              )}
            </div>
            <button className="btn-primary w-full inline-flex items-center justify-center gap-2" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Publicar aviso'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
