import { useMemo, useRef, useState } from 'react'
import { Modal, FoodImage } from './ui.jsx'
import { MEALS, scaleFood, fmt, allFoods, normalize, recipeAsFood, resolveFood } from '../lib/nutrition.js'
import { RECIPES } from '../data/recipes.js'
import { useStore, useToast, uid } from '../store/AppStore.jsx'
import { toKey } from '../lib/date.js'
import { defaultMeal, findEntry } from '../lib/quickAdd.js'
import { QuickButton, QuickInfo, mealIn, useQuickAdd } from './QuickAdd.jsx'

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

/** Vyhľadanie potraviny alebo receptu; ＋ zapisuje hneď, ťuknutie na názov otvorí presné množstvo. */
export function FoodPickerModal({ date, meal, onClose }) {
  const { state, dispatch } = useStore()
  const quick = useQuickAdd()
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const [tab, setTab] = useState('nedavne')
  // Záznamy, ktoré v jedle boli už pred otvorením okna, sa do súhrnu „pribudlo“ nerátajú.
  const before = useRef(new Set((state.diary[date]?.foods || []).map((e) => e.id)))

  const allItems = useMemo(() => [...allFoods(state.customFoods), ...RECIPES.map(recipeAsFood)], [state.customFoods])
  const recent = useMemo(() => {
    const seen = new Set()
    const ids = []
    for (const d of Object.keys(state.diary).sort().reverse()) {
      for (const e of [...state.diary[d].foods].reverse()) {
        if (seen.has(e.foodId)) continue
        seen.add(e.foodId)
        ids.push(e.foodId)
      }
    }
    return ids
  }, [state.diary])

  const items = useMemo(() => {
    const nq = normalize(q.trim())
    if (nq) return allItems.filter((f) => normalize(`${f.name} ${f.brand || ''}`).includes(nq)).slice(0, 60)
    if (tab === 'oblubene') return allItems.filter((f) => state.favorites.includes(f.id)).slice(0, 60)
    if (tab === 'recepty') return allItems.filter((f) => f.category === 'recept')
    const byId = new Map(allItems.map((f) => [f.id, f]))
    return recent.map((id) => byId.get(id)).filter(Boolean).slice(0, 60)
  }, [q, tab, allItems, recent, state.favorites])

  const added = (state.diary[date]?.foods || []).filter((e) => e.meal === meal && !before.current.has(e.id))
  const addedFoods = added.map((e) => ({ e, f: resolveFood(e.foodId, state.customFoods) })).filter((x) => x.f)
  const addedKcal = addedFoods.reduce((s, { e, f }) => s + scaleFood(f, e.grams).kcal, 0)
  const mealTitle = MEALS.find((m) => m.id === meal)?.name
  const count = addedFoods.length

  return (
    <Modal
      title={picked ? 'Presné množstvo' : `Pridať do: ${mealTitle}`}
      onClose={onClose}
      footer={
        !picked && (
          <button type="button" className="btn primary block" onClick={onClose}>
            {count ? `Hotovo · ${count} ${count === 1 ? 'potravina' : count < 5 ? 'potraviny' : 'potravín'} · ${fmt(addedKcal, 0)} kcal` : 'Zavrieť'}
          </button>
        )
      }
    >
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
              const id = uid()
              dispatch({ type: 'food/add', date, entry: { ...entry, id } })
              quick.show(date, id)
              setPicked(null)
            }}
          />
        </>
      ) : (
        <>
          <div className={`added-bar ${count ? '' : 'empty'}`} aria-live="polite">
            {count ? (
              <>
                <b>✓ {mealIn(meal).charAt(0).toUpperCase() + mealIn(meal).slice(1)} pribudlo:</b> {addedFoods.map(({ f }) => f.name).join(', ')} · {fmt(addedKcal, 0)} kcal
              </>
            ) : (
              <>Ťukni na ＋ a potravina sa hneď zapíše. Na názov ťukni, ak chceš zadať presné množstvo.</>
            )}
          </div>
          <input className="search-input" placeholder="Hľadaj potravinu alebo recept…" value={q} onChange={(e) => setQ(e.target.value)} />
          {!q && (
            <div className="tabs small">
              {[
                ['nedavne', 'Nedávne'],
                ['oblubene', 'Obľúbené'],
                ['recepty', 'Recepty'],
              ].map(([id, name]) => (
                <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)} type="button">
                  {name}
                </button>
              ))}
            </div>
          )}
          <ul className="pick-list quick-list">
            {items.map((f) => (
              <li key={f.id} className={findEntry(state.diary[date], f.id, meal) ? 'added' : ''}>
                <button type="button" className="pick-main" onClick={() => setPicked(f)}>
                  <FoodImage food={f} className="thumb" />
                  <span className="pick-text">
                    <span className="ellipsis strong">{f.name}</span>
                    <QuickInfo food={f} meal={meal} date={date} />
                  </span>
                </button>
                <QuickButton food={f} meal={meal} date={date} />
              </li>
            ))}
            {items.length === 0 && (
              <li className="muted pad">
                {q ? 'Nič sa nenašlo.' : tab === 'nedavne' ? 'Zatiaľ nič. Napíš do vyhľadávania, čo si jedol.' : tab === 'oblubene' ? 'Nemáš žiadne obľúbené potraviny.' : 'Nič sa nenašlo.'}
              </li>
            )}
          </ul>
        </>
      )}
    </Modal>
  )
}
