import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { userAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { getErrorMessage, userTypeLabel } from '../../utils/helpers'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import { User, Mail, CreditCard, Hash, GraduationCap, Trash2, MapPin } from 'lucide-react'

const ACADEMIC_UNIT_LABELS = {
  sede: 'Sede (Dois Irmãos)',
  uast: 'UAST (Serra Talhada)',
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [deleteModal, setDeleteModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await userAPI.deleteAccount()
      toast('Conta excluída com sucesso.')
      logout()
      navigate('/login')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-4 border-b border-ru-cream-dark last:border-0">
      <div className="w-8 h-8 bg-ru-cream rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-ru-blue" />
      </div>
      <div>
        <p className="text-xs text-ru-muted font-body">{label}</p>
        <p className="font-body font-medium text-ru-charcoal text-sm mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  )

  const cpfFormatted = user?.cpf
    ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : '—'

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-ru-charcoal">Perfil</h1>
        <p className="text-ru-muted font-body text-sm mt-1">Seus dados cadastrais</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-ru-blue rounded-2xl flex items-center justify-center">
          <span className="font-display font-bold text-white text-2xl">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <p className="font-display font-semibold text-ru-charcoal text-lg">{user?.name}</p>
          <div className="flex gap-2 mt-1">
            <span className="tag bg-blue-50 text-blue-700">{userTypeLabel(user?.type)}</span>
            {user?.academic_unit && (
              <span className="tag bg-emerald-50 text-emerald-700">
                {ACADEMIC_UNIT_LABELS[user.academic_unit] || user.academic_unit}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <Field icon={User} label="Nome completo" value={user?.name} />
        <Field icon={Mail} label="Email" value={user?.email} />
        <Field icon={CreditCard} label="CPF" value={cpfFormatted} />
        <Field
          icon={MapPin}
          label="Unidade Acadêmica"
          value={ACADEMIC_UNIT_LABELS[user?.academic_unit] || user?.academic_unit}
        />
        {user?.type === 'estudante' && (
          <Field icon={GraduationCap} label="Matrícula" value={user?.enrollment} />
        )}
        {user?.type === 'funcionario' && (
          <Field icon={Hash} label="Código do funcionário" value={user?.employee_code} />
        )}
      </div>

      <button
        onClick={() => setDeleteModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-500 font-body font-medium text-sm hover:bg-red-50 transition-colors"
      >
        <Trash2 size={16} />
        Excluir minha conta
      </button>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir conta">
        <p className="font-body text-ru-charcoal text-sm mb-2">
          Tem certeza que deseja excluir sua conta?
        </p>
        <p className="font-body text-red-500 text-xs mb-6">
          Esta ação é permanente e não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteModal(false)} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn-danger flex-1 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size={16} /> : 'Excluir'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
