import { useMemo, useState } from 'react'
import { Modal, FoodImage } from './ui.jsx'
import { MEALS, scaleFood, fmt, allFoods, normalize, recipeAsFood } from '../lib/nutrition.js'
import { RECIPES } from '../data/recipes.js'
import { useStore, useToast } from '../store/AppStore.jsx'
import { toKey } from '../lib/date.js'

function defaultMeal() {
  const h = new Date().getHours()
  if (h < 9) return 'ranajky'
  if (h < 11) return 'desiata'
  if (h < 14) return 'obed'
  if (h < 17) return 'olovrant'
  if (h < 21) return 'vecera'
  return 'druha-vecera'
}

/** Formulár množstva a jedla pre konkrétnu potravinu. */
export function AmountForm({ food, initial, onSubmit, submitLabel = 'Zapísať do jedálnička', showDate = true }) {
  const [qty, setQty] = useState(initial?.qty ?? (food.units[1] ? 1 : 100))
  const [unit, setUnit] = useState(initial?.unit ?? (food.units[1] ? food.units[1][0] : 'g'))
  const [meal, setMeal] = useState(initial?.meal ?? defaultMeal())
  const [date, setDate] = useState(initial?.date ?? toKey())
  const unitGrams = food.units.find((u) => u[0] === unit)?.[1] ?? 1
  const grams = Math.max(0, Number(qty) || 0) * unitGrams
  const n = scaleFood(food, grams)

  return (
    <form
      className="amount-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (grams <= 0) return
        onSubmit({ foodId: food.id, grams, qty: Number(qty), unit, meal, date })
      }}
    >
      <div className="amount-head">
        <FoodImage food={food} className="thumb xl" />
        <div>
          <strong>{food.name}</strong>
          <div className="muted small">{fmt(food.kcal, 0)} kcal / 100 g</div>
        </div>
      </div>
      <div className="row gap">
        <label className="field grow">
          <span>Množstvo</span>
          <input type="number" min="0" step="any" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </label>
        <label className="field grow">
          <span>Jednotka</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {food.units.map(([u, g]) => (
              <option key={u} value={u}>
                {u === 'g' ? 'g' : `${u} (${g} g)`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row gap">
        <label className="field grow">
          <span>Jedlo</span>
          <select value={meal} onChange={(e) => setMeal(e.target.value)}>
            {MEALS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        {showDate && (
          <label className="field grow">
            <span>Dátum</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        )}
      </div>
      <div className="amount-summary">
        <div>
          <span className="big">{fmt(n.kcal, 0)}</span> kcal
          <span className="muted"> · {fmt(grams, 0)} g</span>
        </div>
        <div className="macro-chips">
          <span className="chip protein">B {fmt(n.protein)} g</span>
          <span className="chip carbs">S {fmt(n.carbs)} g</span>
          <span className="chip fat">T {fmt(n.fat)} g</span>
        </div>
      </div>
      <button className="btn primary block" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

export function AddFoodModal({ food, onClose, initial }) {
  const { dispatch } = useStore()
  const toast = useToast()
  return (
    <Modal title="Zapísať potravinu" onClose={onClose}>
      <AmountForm
        food={food}
        initial={initial}
        onSubmit={({ date, ...entry }) => {
          dispatch({ type: 'food/add', date, entry })
          toast(`${food.name} zapísané`)
          onClose()
        }}
      />
    </Modal>
  )
}

/** Vyhľadanie potraviny alebo receptu a následné zapísanie do jedálnička. */
export function FoodPickerModal({ date, meal, onClose }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const [tab, setTab] = useState('vsetko')

  const items = useMemo(() => {
    const foods = allFoods(state.customFoods)
    const recipes = RECIPES.map(recipeAsFood)
    let list = tab === 'oblubene' ? foods.filter((f) => state.favorites.includes(f.id)) : tab === 'recepty' ? recipes : [...foods, ...recipes]
    if (tab === 'nedavne') {
      const seen = new Set()
      const recent = []
      const days = Object.keys(state.diary).sort().reverse()
      for (const d of days) {
        for (const e of [...state.diary[d].foods].reverse()) {
          if (seen.has(e.foodId)) continue
          seen.add(e.foodId)
          recent.push(e.foodId)
        }
      }
      list = recent.map((id) => [...foods, ...recipes].find((f) => f.id === id)).filter(Boolean)
    }
    const nq = normalize(q.trim())
    if (nq) list = list.filter((f) => normalize(f.name).includes(nq))
    return list.slice(0, 60)
  }, [q, tab, state.customFoods, state.favorites, state.diary])

  return (
    <Modal title={picked ? 'Množstvo' : 'Pridať potravinu'} onClose={onClose}>
      {picked ? (
        <>
          <button className="link-btn" onClick={() => setPicked(null)}>
            ‹ späť na vyhľadávanie
          </button>
          <AmountForm
            food={picked}
            initial={{ meal, date }}
            showDate={false}
            onSubmit={({ date: _d, ...entry }) => {
              dispatch({ type: 'food/add', date, entry })
              toast(`${picked.name} zapísané`)
              onClose()
            }}
          />
        </>
      ) : (
        <>
          <input className="search-input" placeholder="Hľadaj potravinu alebo recept…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <div className="tabs small">
            {[
              ['vsetko', 'Všetko'],
              ['nedavne', 'Nedávne'],
              ['oblubene', 'Obľúbené'],
              ['recepty', 'Recepty'],
            ].map(([id, name]) => (
              <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)} type="button">
                {name}
              </button>
            ))}
          </div>
          <ul className="pick-list">
            {items.map((f) => (
              <li key={f.id}>
                <button onClick={() => setPicked(f)}>
                  <FoodImage food={f} className="thumb" />
                  <span className="grow">{f.name}</span>
                  <span className="muted small">{fmt(f.kcal, 0)} kcal/100 g</span>
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="muted pad">Nič sa nenašlo.</li>}
          </ul>
        </>
      )}
    </Modal>
  )
}
