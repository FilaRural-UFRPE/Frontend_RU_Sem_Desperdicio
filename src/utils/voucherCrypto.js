import { verifyAsync } from '@noble/ed25519'

const PUBLIC_KEY_CACHE_KEY = 'smartru_voucher_public_key'

export async function fetchAndCachePublicKey(api) {
  const { data } = await api.get('/voucher/public-key')
  localStorage.setItem(PUBLIC_KEY_CACHE_KEY, data.public_key)
  return data.public_key
}

export function getCachedPublicKey() {
  return localStorage.getItem(PUBLIC_KEY_CACHE_KEY)
}

function hexToBytes(hex) {
  if (!/^[0-9a-f]{128}$/i.test(hex)) throw new Error('Assinatura malformada')
  return Uint8Array.from(hex.match(/.{2}/g), (byte) => Number.parseInt(byte, 16))
}

function pemToRawPublicKey(pem) {
  const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const spki = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  if (spki.length < 32) throw new Error('Chave pública inválida')
  return spki.slice(-32)
}

export function parseQRData(qrString) {
  const parsed = JSON.parse(qrString)
  if (parsed.v !== 1 || !Number.isInteger(parsed.id) || !parsed.c || !parsed.n || !parsed.s || !parsed.e) {
    throw new Error('Este QR não é um voucher SmartRU válido')
  }
  return parsed
}

export function buildValidationPayload(cpf, nonce, expiresAt) {
  return `${cpf}:${nonce}:${expiresAt}`
}

export async function verifyVoucherSignature(publicKeyPem, voucher) {
  if (!publicKeyPem) throw new Error('Chave offline ainda não foi baixada')
  const payload = new TextEncoder().encode(buildValidationPayload(voucher.c, voucher.n, voucher.e))
  return verifyAsync(hexToBytes(voucher.s), payload, pemToRawPublicKey(publicKeyPem))
}
