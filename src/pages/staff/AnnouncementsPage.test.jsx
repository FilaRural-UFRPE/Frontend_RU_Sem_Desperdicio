import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider } from '../../contexts/ToastContext'
import AnnouncementsPage from './AnnouncementsPage'

vi.mock('../../services/api', () => ({
  announcementAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    notify: vi.fn(),
    publicList: vi.fn(),
  },
}))

import { announcementAPI } from '../../services/api'

const renderPage = () =>
  render(
    <ToastProvider>
      <AnnouncementsPage />
    </ToastProvider>
  )

const fillForm = () => {
  fireEvent.change(screen.getByPlaceholderText('Ex.: RU fechado hoje à noite'), {
    target: { value: 'Fechado' },
  })
  fireEvent.change(
    screen.getByPlaceholderText('Detalhe a mensagem que será enviada aos usuários...'),
    { target: { value: 'O RU não abre hoje à noite.' } }
  )
}

describe('AnnouncementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    announcementAPI.list.mockResolvedValue({ data: { data: [] } })
  })

  it('cria o aviso, fecha o modal e não duplica quando o envio de e-mail falha', async () => {
    const origConfirm = window.confirm
    window.confirm = () => true
    announcementAPI.create.mockResolvedValue({ data: { success: true, data: { id: 7 } } })
    announcementAPI.notify.mockRejectedValue(new Error('falha no e-mail'))

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Criar aviso' }))
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Publicar aviso' }))

    await waitFor(() => expect(announcementAPI.create).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(announcementAPI.notify).toHaveBeenCalledWith(7))
    await waitFor(() => expect(screen.queryByText('Novo aviso')).not.toBeInTheDocument())
    expect(screen.getByText(/Aviso salvo, mas o envio por e-mail falhou/)).toBeInTheDocument()
    window.confirm = origConfirm
  })

  it('não dispara e-mail quando a opção "Enviar por e-mail agora" está desmarcada', async () => {
    announcementAPI.create.mockResolvedValue({ data: { success: true, data: { id: 8 } } })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Criar aviso' }))
    fillForm()
    fireEvent.click(screen.getByRole('checkbox', { name: /Enviar por e-mail agora/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Publicar aviso' }))

    await waitFor(() => expect(announcementAPI.create).toHaveBeenCalledTimes(1))
    expect(announcementAPI.notify).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText('Aviso salvo')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Novo aviso')).not.toBeInTheDocument())
  })
})
