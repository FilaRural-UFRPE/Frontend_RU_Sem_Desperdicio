import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../contexts/ToastContext'
import WinnerPage from './WinnerPage'

vi.mock('../../services/api', () => ({
  rankingAPI: {
    list: vi.fn(),
    winner: vi.fn(),
    importCsv: vi.fn(),
    setWinner: vi.fn(),
    raffleCreate: vi.fn(),
    raffleList: vi.fn(),
    raffleDraw: vi.fn(),
    raffleWinners: vi.fn(),
  },
}))

import { rankingAPI } from '../../services/api'

const renderPage = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <WinnerPage />
      </ToastProvider>
    </MemoryRouter>
  )

const RANK = [
  {
    rank: 1,
    name: 'Ana',
    cpf: '12345678901',
    academic_unit: 'sede',
    schedule_count: 5,
    confirmed_count: 4,
  },
]

describe('WinnerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rankingAPI.list.mockResolvedValue({ data: { data: RANK } })
    rankingAPI.winner.mockResolvedValue({ data: { data: null } })
  })

  it('exige confirmação antes de registrar vencedor manual', async () => {
    const confirmSpy = vi.fn(() => false)
    window.confirm = confirmSpy

    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Coroa!' }))

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Ana'))
    expect(rankingAPI.setWinner).not.toHaveBeenCalled()
  })

  it('registra vencedor após confirmação', async () => {
    const confirmSpy = vi.fn(() => true)
    window.confirm = confirmSpy
    rankingAPI.setWinner.mockResolvedValue({ data: { success: true } })

    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Coroa!' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(rankingAPI.setWinner).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      '12345678901'
    )
  })
})
