// Rýchly zápis potravín: predvolené množstvo, kroky ＋ / − a text množstva s gramážou.
// Zámerne bez závislosti na databáze potravín, aby sa dalo testovať samostatne.

const num = (n, d) => new Intl.NumberFormat('sk-SK', { maximumFractionDigits: d }).format(n)

/** Jedlo podľa dennej doby. */
export function defaultMeal(hour = new Date().getHours()) {
  if (hour < 9) return 'ranajky'
  if (hour < 11) return 'desiata'
  if (hour < 14) return 'obed'
  if (hour < 17) return 'olovrant'
  if (hour < 21) return 'vecera'
  return 'druha-vecera'
}

const unitGrams = (food, unit) => food.units.find((u) => u[0] === unit)?.[1]

/** Naposledy zjedené množstvo potraviny, alebo null. */
export function lastAmount(food, diary) {
  const days = Object.keys(diary).sort().reverse()
  for (const d of days) {
    const foods = diary[d].foods || []
    for (let i = foods.length - 1; i >= 0; i--) {
      const e = foods[i]
      if (e.foodId !== food.id) continue
      const g = unitGrams(food, e.unit)
      if (g) return { qty: e.qty, unit: e.unit, grams: e.qty * g }
    }
  }
  return null
}

/** Naposledy zjedené množstvo; ak nie je, prvá porcia; inak 100 g. */
export function defaultAmount(food, diary) {
  const last = lastAmount(food, diary)
  if (last) return last
  const portion = food.units.find((u) => u[0] !== 'g')
  return portion ? { qty: 1, unit: portion[0], grams: portion[1] } : { qty: 100, unit: 'g', grams: 100 }
}

/** „2 ks (86 g)“ alebo „150 g“. */
export function amountText(food, qty, unit) {
  if (unit === 'g') return `${num(qty, 0)} g`
  return `${num(qty, 1)} ${unit} (${num(qty * (unitGrams(food, unit) ?? 0), 0)} g)`
}

/** Posledný záznam potraviny v danom jedle dňa. */
export function findEntry(day, foodId, meal) {
  const foods = day?.foods || []
  for (let i = foods.length - 1; i >= 0; i--) if (foods[i].foodId === foodId && foods[i].meal === meal) return foods[i]
  return null
}

const stepOf = (entry) => (entry.unit === 'g' ? entry.step || 50 : 1)

function withQty(entry, food, qty) {
  const g = entry.unit === 'g' ? 1 : unitGrams(food, entry.unit) ?? entry.grams / entry.qty
  return { qty, grams: qty * g }
}

/** Úprava záznamu po ťuknutí na ＋. */
export function stepUp(entry, food) {
  return withQty(entry, food, entry.qty + stepOf(entry))
}

/** Úprava záznamu po ťuknutí na −; null znamená záznam zmazať. */
export function stepDown(entry, food) {
  const qty = entry.qty - stepOf(entry)
  return qty > 0 ? withQty(entry, food, qty) : null
}
