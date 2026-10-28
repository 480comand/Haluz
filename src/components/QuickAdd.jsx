import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useStore, uid } from '../store/AppStore.jsx'
import { MEALS, fmt, resolveFood, scaleFood } from '../lib/nutrition.js'
import { amountText, defaultAmount, findEntry, lastAmount, stepDown, stepUp } from '../lib/quickAdd.js'

const mealName = (id) => MEALS.find((m) => m.id === id)?.name ?? id
const MEAL_IN = {
  ranajky: 'v raňajkách',
  desiata: 'v desiate',
  obed: 'v obede',
  olovrant: 'v olovrante',
  vecera: 'vo večeri',
  'druha-vecera': 'v druhej večeri',
}
export const mealIn = (id) => MEAL_IN[id] ?? mealName(id)

const QuickContext = createContext(null)

/** Zápis na jedno ťuknutie: ＋ / − pri potravine a hláška so Späť a Upraviť. */
export function QuickAddProvider({ children }) {
  const { state, dispatch } = useStore()
  const [last, setLast] = useState(null) // { date, id, editing }
  const timer = useRef(null)

  const show = useCallback((date, id) => {
    clearTimeout(timer.current)
    setLast({ date, id, editing: false })
    timer.current = setTimeout(() => setLast((l) => (l && !l.editing ? null : l)), 5000)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const add = useCallback(
    (food, meal, date, amount = defaultAmount(food, state.diary), { silent = false } = {}) => {
      const id = uid()
      const entry = { id, foodId: food.id, grams: amount.grams, qty: amount.qty, unit: amount.unit, meal }
      if (amount.unit === 'g') entry.step = amount.qty
      dispatch({ type: 'food/add', date, entry })
      if (!silent) show(date, id)
      return id
    },
    [dispatch, show, state.diary],
  )

  const plus = useCallback(
    (food, meal, date) => {
      const e = findEntry(state.diary[date], food.id, meal)
      if (!e) return add(food, meal, date)
      dispatch({ type: 'food/update', date, id: e.id, patch: stepUp(e, food) })
      show(date, e.id)
    },
    [add, dispatch, show, state.diary],
  )

  const minus = useCallback(
    (food, meal, date) => {
      const e = findEntry(state.diary[date], food.id, meal)
      if (!e) return
      const patch = stepDown(e, food)
      if (patch) {
        dispatch({ type: 'food/update', date, id: e.id, patch })
        show(date, e.id)
      } else {
        dispatch({ type: 'food/remove', date, id: e.id })
        setLast((l) => (l?.id === e.id ? null : l))
      }
    },
    [dispatch, show, state.diary],
  )

  const value = useMemo(() => ({ add, plus, minus, show }), [add, plus, minus, show])
  const entry = last && state.diary[last.date]?.foods.find((f) => f.id === last.id)

  return (
    <QuickContext.Provider value={value}>
      {children}
      {entry && (
        <QuickToast
          entry={entry}
          editing={last.editing}
          onUndo={() => {
            dispatch({ type: 'food/remove', date: last.date, id: entry.id })
            setLast(null)
          }}
          onEdit={() => {
            clearTimeout(timer.current)
            setLast((l) => ({ ...l, editing: true }))
          }}
          onDone={() => setLast(null)}
          onPick={(patch) => dispatch({ type: 'food/update', date: last.date, id: entry.id, patch })}
        />
      )}
    </QuickContext.Provider>
  )
}

export function useQuickAdd() {
  return useContext(QuickContext)
}

function QuickToast({ entry, editing, onUndo, onEdit, onDone, onPick }) {
  const { state } = useStore()
  const food = resolveFood(entry.foodId, state.customFoods)
  if (!food) return null
  const kcal = scaleFood(food, entry.grams).kcal
  const portion = food.units.find((u) => u[0] !== 'g')
  const options = [
    ...(portion ? [0.5, 1, 2, 3].map((q) => ({ qty: q, unit: portion[0], grams: q * portion[1] })) : []),
    ...[50, 100, 150, 200].map((g) => ({ qty: g, unit: 'g', grams: g, step: g })),
  ]
  return (
    <div className={`quick-toast ${editing ? 'editing' : ''}`} role="status" aria-live="polite">
      <div className="quick-toast-row">
        <span className="quick-toast-text">
          ✓ <b>{food.name}</b> · {amountText(food, entry.qty, entry.unit)} · {fmt(kcal, 0)} kcal → {mealName(entry.meal)}
        </span>
        {editing ? (
          <button type="button" onClick={onDone}>
            Hotovo
          </button>
        ) : (
          <>
            <button type="button" onClick={onUndo}>
              Späť
            </button>
            <button type="button" onClick={onEdit}>
              Upraviť
            </button>
          </>
        )}
      </div>
      {editing && (
        <div className="quick-toast-options">
          {options.map((o) => (
            <button
              key={`${o.qty}${o.unit}`}
              type="button"
              aria-pressed={o.qty === entry.qty && o.unit === entry.unit}
              onClick={() => onPick({ qty: o.qty, unit: o.unit, grams: o.grams, ...(o.unit === 'g' ? { step: o.qty } : {}) })}
            >
              {amountText(food, o.qty, o.unit)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Tlačidlo ＋, po pridaní dvojica − ＋. */
export function QuickButton({ food, meal, date }) {
  const { state } = useStore()
  const { plus, minus } = useQuickAdd()
  const entry = findEntry(state.diary[date], food.id, meal)
  if (!entry) {
    return (
      <button type="button" className="quick-add" onClick={() => plus(food, meal, date)} aria-label={`Zapísať ${food.name} do: ${mealName(meal)}`}>
        ＋
      </button>
    )
  }
  return (
    <span className="quick-stepper">
      <button type="button" onClick={() => minus(food, meal, date)} aria-label={`Uberať ${food.name}`}>
        −
      </button>
      <button type="button" onClick={() => plus(food, meal, date)} aria-label={`Pridať ${food.name}`}>
        ＋
      </button>
    </span>
  )
}

/** Riadok pod názvom potraviny: čo je už zapísané, alebo čo sa zapíše po ťuknutí na ＋. */
export function QuickInfo({ food, meal, date }) {
  const { state } = useStore()
  const entry = findEntry(state.diary[date], food.id, meal)
  if (entry) {
    return (
      <span className="quick-info added">
        ✓ {mealIn(meal)}: {amountText(food, entry.qty, entry.unit)} · {fmt(scaleFood(food, entry.grams).kcal, 0)} kcal
      </span>
    )
  }
  const last = lastAmount(food, state.diary)
  const a = last || defaultAmount(food, state.diary)
  return (
    <span className="quick-info">
      {last ? <em>naposledy {amountText(food, a.qty, a.unit)}</em> : amountText(food, a.qty, a.unit)} · {fmt(scaleFood(food, a.grams).kcal, 0)} kcal
    </span>
  )
}

/** Výber jedla ako rad tlačidiel. */
export function MealChips({ value, onChange, label = 'Jedlo' }) {
  return (
    <div className="meal-chips" role="group" aria-label={label}>
      {MEALS.map((m) => (
        <button key={m.id} type="button" aria-pressed={value === m.id} onClick={() => onChange(m.id)}>
          {m.name}
        </button>
      ))}
    </div>
  )
}
