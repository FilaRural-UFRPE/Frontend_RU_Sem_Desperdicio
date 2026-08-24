import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppLayout from './AppLayout'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { type: 'estudante', name: 'João' }, logout: vi.fn() }),
}))

const renderApp = () =>
  render(
    <MemoryRouter>
      <AppLayout>
        <p>Conteúdo principal</p>
      </AppLayout>
    </MemoryRouter>
  )

describe('AppLayout (menu móvel)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('abre o menu móvel como diálogo acessível', async () => {
    renderApp()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'Menu de navegação')
  })

  it('fecha com Escape', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('fecha ao clicar no overlay', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
