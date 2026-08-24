import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ToastProvider } from '../../contexts/ToastContext'
import CashierPage from './CashierPage'

let scanCallback = null

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class {
    constructor() {
      this.isScanning = false
    }
    async start(_config, _uiConfig, callback) {
      scanCallback = callback
      this.isScanning = true
    }
    async stop() {
      this.isScanning = false
    }
    clear() {}
  },
}))

vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
  campaignAPI: {
    getVoucher: vi.fn(),
    useVoucher: vi.fn(),
  },
}))

vi.mock('../../utils/voucherCrypto', () => ({
  fetchAndCachePublicKey: vi.fn(async () => 'pub'),
  getCachedPublicKey: vi.fn(() => 'pub'),
  parseQRData: (raw) => JSON.parse(raw),
  verifyVoucherSignature: vi.fn(async () => true),
}))

import { campaignAPI } from '../../services/api'

const renderPage = () =>
  render(
    <ToastProvider>
      <CashierPage />
    </ToastProvider>
  )

const VOUCHER = {
  id: 5,
  user_cpf: '12345678901',
  user_name: 'Maria Silva',
  code: 'EV-2026-005',
  meals_used: 2,
  total_meals: 5,
  usages: [{ id: 1, meal_date: '2020-01-01', meal_type: 'lunch' }],
}

const QR = JSON.stringify({
  v: 2,
  id: 5,
  c: '12345678901',
  n: 'nonce-abc',
  s: 'ab'.repeat(64),
  e: '2099-12-31T23:59:59Z',
})

describe('CashierPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    scanCallback = null
    campaignAPI.getVoucher.mockResolvedValue({ data: { success: true, data: VOUCHER } })
  })

  it('não dispara requisições concorrentes no duplo clique de "Comeu hoje!"', async () => {
    let resolveUse
    campaignAPI.useVoucher.mockReturnValue(
      new Promise((res) => {
        resolveUse = res
      })
    )

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir câmera' }))
    await waitFor(() => expect(scanCallback).toBeTruthy())

    await act(async () => {
      await scanCallback(QR)
    })

    const button = screen.getByRole('button', { name: 'Comeu hoje!' })
    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => expect(campaignAPI.useVoucher).toHaveBeenCalledTimes(1))
    expect(campaignAPI.useVoucher).toHaveBeenCalledWith(5, 'nonce-abc', 'ab'.repeat(64))

    await act(async () => {
      resolveUse({
        data: { success: true, data: { user_name: 'Maria Silva', meals_used: 3, total_meals: 5 } },
      })
    })
    await waitFor(() => expect(screen.getByText('Almoço já registrado hoje')).toBeInTheDocument())
  })

  it('mantém o botão indisponível enquanto a requisição está em andamento', async () => {
    campaignAPI.useVoucher.mockReturnValue(new Promise(() => {}))

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir câmera' }))
    await waitFor(() => expect(scanCallback).toBeTruthy())
    await act(async () => {
      await scanCallback(QR)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Comeu hoje!' }))
    expect(screen.getByRole('button', { name: 'Registrando…' })).toBeDisabled()
  })
})
