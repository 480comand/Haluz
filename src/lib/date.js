export function toKey(d = new Date()) {
  const dt = new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function lastNDays(n, endKey = toKey()) {
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endKey, -i))
  return out
}

export function dayLabel(key) {
  const today = toKey()
  if (key === today) return 'Dnes'
  if (key === addDays(today, -1)) return 'Včera'
  if (key === addDays(today, 1)) return 'Zajtra'
  return fromKey(key).toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })
}
