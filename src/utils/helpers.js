// Valida CPF (dígitos verificadores)
export function validateCPF(cpf) {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(c[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(c[10])
}

export function maskCPF(v) {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const dt = new Date(isoStr)
  return dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function mealLabel(type) {
  return type === 'lunch' ? '🍽️ Almoço' : '🌙 Jantar'
}

export function statusColor(status) {
  const map = {
    ativo: 'bg-emerald-50 text-emerald-700',
    cancelado: 'bg-red-50 text-red-600',
    reagendado: 'bg-amber-50 text-amber-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function userTypeLabel(type) {
  const map = { estudante: 'Estudante', funcionario: 'Funcionário RU', convidado: 'Convidado' }
  return map[type] ?? type
}

export function passwordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (score <= 2) return { level: 1, label: 'Fraca', color: 'bg-red-500' }
  if (score <= 3) return { level: 2, label: 'Média', color: 'bg-amber-500' }
  return { level: 3, label: 'Forte', color: 'bg-emerald-500' }
}

export function toBRDate(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('/')) return dateStr
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function localISODate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatLocalDate(value) {
  if (!value) return '—'
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife' }).format(new Date(value))
}

export const MEAL_TYPE_LABELS = {
  select: '👑 Select',
  leve_sabor: '🥗 Leve Sabor',
  essencial: '🍱 Essencial',
  vegetariano: '🌿 Vegetariano',
}

export function getErrorMessage(err) {
  const data = err?.response?.data
  const status = err?.response?.status

  // Rate limit
  if (status === 429) {
    return data?.message || 'Muitas tentativas. Tente novamente mais tarde.'
  }

  // Formato padronizado do Iarley — preferir message
  if (data?.message) return data.message

  // Fallback para detail.msg
  if (data?.detail?.msg) {
    const msg = data.detail.msg
    if (msg.includes('duplicate key')) return 'Já tens uma refeição agendada para esse dia e tipo!'
    if (msg.includes('unique constraint'))
      return 'Já tens uma refeição agendada para esse dia e tipo!'
    return msg
  }

  if (typeof data === 'string') return data

  if (data?.detail) {
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(', ')
  }

  // Erros de validação 422
  if (status === 422 && data?.details) {
    return data.details.map((d) => d.msg || d.message).join(', ')
  }

  if (data?.msg) return data.msg
  return err?.message || 'Ocorreu um erro inesperado.'
}
