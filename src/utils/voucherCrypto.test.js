import { describe, expect, it } from 'vitest'
import { signAsync } from '@noble/ed25519'
import { buildValidationPayload, parseQRData, verifyVoucherSignature } from './voucherCrypto'

const PRIVATE_KEY = Uint8Array.from(
  '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60'.match(/.{2}/g),
  (byte) => Number.parseInt(byte, 16)
)
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`

describe('event voucher QR v2', () => {
  it('accepts a complete v2 payload', () => {
    const voucher = {
      v: 2,
      id: 42,
      c: '52998224725',
      n: 'a'.repeat(32),
      s: 'b'.repeat(128),
      e: '2026-09-01T00:00:00Z',
    }
    expect(parseQRData(JSON.stringify(voucher))).toEqual(voucher)
  })

  it('rejects malformed or incomplete payloads', () => {
    expect(() => parseQRData('{"v":2,"id":42}')).toThrow('não é um voucher SmartRU válido')
  })

  it('rejects a forged signature', async () => {
    const voucher = {
      v: 2,
      id: 42,
      c: '52998224725',
      n: 'a'.repeat(32),
      s: 'b'.repeat(128),
      e: '2026-09-01T00:00:00Z',
    }
    await expect(verifyVoucherSignature(PUBLIC_KEY_PEM, voucher)).resolves.toBe(false)
  })

  it('verifies the signed CPF, nonce and expiry', async () => {
    const voucher = { v: 2, id: 42, c: '52998224725', n: 'a'.repeat(32), e: '2026-09-01T00:00:00Z' }
    const message = new TextEncoder().encode(
      buildValidationPayload(voucher.c, voucher.n, voucher.e)
    )
    voucher.s = Array.from(await signAsync(message, PRIVATE_KEY), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('')
    await expect(verifyVoucherSignature(PUBLIC_KEY_PEM, voucher)).resolves.toBe(true)
  })
})
