import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../ui/Logo'
import {
  LayoutDashboard,
  Calendar,
  History,
  User,
  LogOut,
  BarChart3,
  ClipboardList,
  Menu,
  Lock,
  UtensilsCrossed,
  UploadCloud,
  Gift,
  ScanLine,
  Trophy,
  Crown,
  FileSpreadsheet,
  Shuffle,
  CircleDot,
  ScrollText,
  Megaphone,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { userTypeLabel } from '../../utils/helpers'

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/agendar', icon: Calendar, label: 'Agendar' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/cardapio', icon: UtensilsCrossed, label: 'Cardápio da Semana' },
  { to: '/voucher', icon: Gift, label: 'Meu voucher' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/perfil', icon: User, label: 'Perfil' },
  { to: '/alterar-senha', icon: Lock, label: 'Alterar senha' },
]

const staffLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/agendamentos', icon: ClipboardList, label: 'Agendamentos' },
  { to: '/roleta', icon: CircleDot, label: 'Roleta de prêmios' },
  { to: '/avisos', icon: Megaphone, label: 'Avisos' },
  { to: '/voucher/gerar', icon: Gift, label: 'Gerar voucher' },
  { to: '/voucher/validar', icon: ScanLine, label: 'Validar voucher' },
  { to: '/voucher/caixa', icon: UtensilsCrossed, label: 'Caixa do evento' },
  { to: '/voucher/evento-historico', icon: ScrollText, label: 'Vouchers do evento' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/ranking/importar', icon: FileSpreadsheet, label: 'Importar presenças' },
  { to: '/ranking/sorteios', icon: Shuffle, label: 'Sorteios' },
  { to: '/ranking/vencedor', icon: Crown, label: 'Vencedor do mês' },
  { to: '/cardapio-upload', icon: UploadCloud, label: 'Publicar Cardápio' },
  { to: '/perfil', icon: User, label: 'Perfil' },
  { to: '/alterar-senha', icon: Lock, label: 'Alterar senha' },
]

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!mobileOpen) return undefined
    previousFocusRef.current = document.activeElement
    const drawer = drawerRef.current
    const focusable = () =>
      Array.from(
        drawer?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      )
    focusable()[0]?.focus()

    const handler = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) {
        event.preventDefault()
        drawer?.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus?.()
    }
  }, [mobileOpen])

  const links = user?.type === 'funcionario' ? staffLinks : studentLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      end
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl font-body font-medium text-sm transition-all duration-150 ${
          isActive ? 'bg-ru-blue text-white shadow-sm' : 'text-ru-charcoal hover:bg-ru-cream-dark'
        }`
      }
    >
      <Icon size={17} />
      {label}
    </NavLink>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-ru-cream-dark">
        <Logo variant="full" size={36} />
      </div>

      {/* User badge */}
      <div className="mx-3 mt-4 mb-2 px-3 py-2.5 bg-ru-cream rounded-xl">
        <p className="font-body font-medium text-ru-charcoal text-sm truncate">
          {user?.name?.split(' ')[0]}
        </p>
        <p className="text-xs text-ru-muted font-body">{userTypeLabel(user?.type)}</p>
      </div>

      {/* Links */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-1">
        {links.map((l) => (
          <NavItem key={l.to} {...l} />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-ru-cream-dark">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-body font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-ru-cream">
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-ru-cream-dark fixed h-full z-30">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" data-testid="mobile-drawer">
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-black/40 cursor-default"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            tabIndex={-1}
            className="absolute left-0 top-0 bottom-0 w-56 bg-white shadow-xl focus:outline-none"
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-ru-cream-dark sticky top-0 z-20">
          <Logo variant="full" size={32} />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="min-w-11 min-h-11 grid place-items-center text-ru-charcoal"
          >
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  )
}
