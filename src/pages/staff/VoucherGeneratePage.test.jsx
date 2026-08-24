import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider } from '../../contexts/ToastContext'
import VoucherGeneratePage from './VoucherGeneratePage'

vi.mock('../../services/api', () => ({
  voucherAPI: {
    mine: vi.fn(),
    generate: vi.fn(),
    availableWinners: vi.fn(),
    publicKey: vi.fn(),
    validate: vi.fn(),
    sync: vi.fn(),
  },
}))

import { voucherAPI } from '../../services/api'

const renderPage = () =>
  render(
    <ToastProvider>
      <VoucherGeneratePage />
    </ToastProvider>
  )

describe('VoucherGeneratePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza vencedor de sorteio sem "undefined comparecimentos"', async () => {
    voucherAPI.availableWinners.mockResolvedValue({
      data: { data: [{ user_cpf: '111', name: 'João', wins: 1, academic_unit: 'sede' }] },
    })

    renderPage()
    expect(await screen.findByText('João')).toBeInTheDocument()
    expect(screen.queryByText(/undefined comparecimentos/)).not.toBeInTheDocument()
    expect(screen.getByText(/1 vitória/)).toBeInTheDocument()
  })

  it('exige confirmação antes de gerar o voucher', async () => {
    voucherAPI.availableWinners.mockResolvedValue({
      data: {
        data: [
          { user_cpf: '111', name: 'João', wins: 1, confirmed_count: 12, academic_unit: 'sede' },
        ],
      },
    })
    const confirmSpy = vi.fn(() => false)
    window.confirm = confirmSpy

    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Gerar voucher/ }))
    expect(confirmSpy).toHaveBeenCalled()
    expect(voucherAPI.generate).not.toHaveBeenCalled()

    confirmSpy.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: /Gerar voucher/ }))
    await waitFor(() => expect(voucherAPI.generate).toHaveBeenCalledWith('111'))
  })
})
