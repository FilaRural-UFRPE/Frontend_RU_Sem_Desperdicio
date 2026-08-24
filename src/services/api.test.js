import { describe, expect, it } from 'vitest'
import { buildEventVoucherUsePayload } from './api'

describe('event voucher consumption payload', () => {
  it('sends possession proof required by the backend', () => {
    expect(buildEventVoucherUsePayload('nonce', 'signature')).toEqual({
      meal_type: 'lunch',
      nonce: 'nonce',
      signature_hex: 'signature',
    })
  })
})
