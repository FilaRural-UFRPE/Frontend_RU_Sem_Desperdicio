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
  return v.replace(/\D/g, '').slice(0, 11)
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
  return type === 'almoco' ? '🍽️ Almoço' : '🌙 Jantar'
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

export function getErrorMessage(err) {
  const data = err?.response?.data
  
  if (typeof data === 'string') return data
  
  if (data?.detail) {
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) return data.detail.map(d => d.msg).join(', ')
    if (data.detail?.msg) {
      const msg = data.detail.msg
      // Mensagens amigáveis para erros conhecidos
      if (msg.includes('duplicate key')) return 'Já tens uma refeição agendada para esse dia e tipo!'
      if (msg.includes('unique constraint')) return 'Já tens uma refeição agendada para esse dia e tipo!'
      return msg
    }
  }
  
  if (data?.msg) return data.msg
  if (data?.message) return data.message
  return err?.message || 'Ocorreu um erro inesperado.'
}