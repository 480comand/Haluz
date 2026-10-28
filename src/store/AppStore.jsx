import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { toKey, addDays } from '../lib/date.js'
import { computePlan, getActivity, activityKcal } from '../lib/nutrition.js'

const STORAGE_KEY = 'nutridennik:v1'

const defaultProfile = {
  sex: 'zena',
  goal: 'schudnut',
  birthYear: 1995,
  height: 168,
  weight: 72,
  targetWeight: 64,
  activity: 'lahko',
  rate: 0.5,
  saved: false,
}

const initialState = {
  profile: defaultProfile,
  diary: {},
  weights: [],
  customFoods: [],
  favorites: [],
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function emptyDay() {
  return { foods: [], activities: [], water: 0 }
}

function updateDay(state, date, fn) {
  const day = state.diary[date] || emptyDay()
  return { ...state, diary: { ...state.diary, [date]: fn(day) } }
}

function reducer(state, action) {
  switch (action.type) {
    case 'profile/set':
      return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'food/add':
      return updateDay(state, action.date, (d) => ({ ...d, foods: [...d.foods, { id: uid(), ...action.entry }] }))
    case 'food/update':
      return updateDay(state, action.date, (d) => ({
        ...d,
        foods: d.foods.map((f) => (f.id === action.id ? { ...f, ...action.patch } : f)),
      }))
    case 'food/remove':
      return updateDay(state, action.date, (d) => ({ ...d, foods: d.foods.filter((f) => f.id !== action.id) }))
    case 'activity/add':
      return updateDay(state, action.date, (d) => ({
        ...d,
        activities: [...d.activities, { id: uid(), ...action.entry }],
      }))
    case 'activity/remove':
      return updateDay(state, action.date, (d) => ({ ...d, activities: d.activities.filter((a) => a.id !== action.id) }))
    case 'water/set':
      return updateDay(state, action.date, (d) => ({ ...d, water: Math.max(0, action.ml) }))
    case 'weight/add': {
      const weights = state.weights.filter((w) => w.date !== action.date)
      weights.push({ date: action.date, kg: action.kg })
      weights.sort((a, b) => a.date.localeCompare(b.date))
      const latest = weights[weights.length - 1]
      return { ...state, weights, profile: { ...state.profile, weight: latest.kg } }
    }
    case 'weight/remove':
      return { ...state, weights: state.weights.filter((w) => w.date !== action.date) }
    case 'custom/add':
      return { ...state, customFoods: [...state.customFoods, { ...action.food, id: `custom-${uid()}`, custom: true }] }
    case 'custom/remove':
      return { ...state, customFoods: state.customFoods.filter((f) => f.id !== action.id) }
    case 'favorite/toggle': {
      const has = state.favorites.includes(action.id)
      return { ...state, favorites: has ? state.favorites.filter((x) => x !== action.id) : [...state.favorites, action.id] }
    }
    case 'state/replace':
      return { ...initialState, ...action.state }
    case 'state/reset':
      return initialState
    default:
      return state
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    return { ...initialState, ...parsed, profile: { ...defaultProfile, ...parsed.profile } }
  } catch {
    return initialState
  }
}

const StoreContext = createContext(null)
const ToastContext = createContext(() => {})

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* úložisko nedostupné – aplikácia funguje ďalej bez ukladania */
    }
  }, [state])

  const toast = useCallback((text) => {
    const id = uid()
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const plan = useMemo(() => computePlan(state.profile), [state.profile])
  const value = useMemo(() => ({ state, dispatch, plan }), [state, plan])

  return (
    <StoreContext.Provider value={value}>
      <ToastContext.Provider value={toast}>
        {children}
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              ✓ {t.text}
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}

export function useToast() {
  return useContext(ToastContext)
}

/** Vytvorí ukážkové záznamy za posledné dva týždne. */
export function buildDemoState(profile) {
  const today = toKey()
  const diary = {}
  const weights = []
  const menus = [
    [
      ['ranajky', 'ovsene-vlocky', 60],
      ['ranajky', 'banan', 120],
      ['desiata', 'grecky-jogurt', 140],
      ['obed', 'kuracie-prsia', 150],
      ['obed', 'ryza', 180],
      ['obed', 'brokolica', 150],
      ['olovrant', 'jablko', 180],
      ['vecera', 'chlieb-celozrnny', 80],
      ['vecera', 'cottage', 150],
      ['vecera', 'rajcina', 120],
    ],
    [
      ['ranajky', 'vajce', 110],
      ['ranajky', 'chlieb-kvaskovy', 80],
      ['desiata', 'mandle', 30],
      ['obed', 'losos', 125],
      ['obed', 'zemiaky', 250],
      ['olovrant', 'tvaroh', 125],
      ['vecera', 'tortilla', 60],
      ['vecera', 'morcacie-prsia', 100],
      ['vecera', 'paprika', 100],
      ['druha-vecera', 'cokolada-horka', 20],
    ],
    [
      ['ranajky', 'skyr', 140],
      ['ranajky', 'muesli', 50],
      ['desiata', 'kiwi', 150],
      ['obed', 'halusky', 350],
      ['olovrant', 'kava-mlieko', 200],
      ['vecera', 'grecky-jogurt', 140],
      ['vecera', 'jahody', 150],
    ],
  ]
  const start = profile.weight + 1.6
  for (let i = 13; i >= 0; i--) {
    const date = addDays(today, -i)
    if (i === 0) continue
    const menu = menus[i % menus.length]
    const act = getActivity(i % 2 ? 'a2' : 'a8')
    const minutes = i % 2 ? 40 : 30
    diary[date] = {
      foods: menu.map(([meal, foodId, grams]) => ({ id: uid(), meal, foodId, grams, qty: grams, unit: 'g' })),
      activities: [{ id: uid(), activityId: act.id, minutes, kcal: Math.round(activityKcal(act, minutes, profile.weight)) }],
      water: 1500 + (i % 4) * 250,
    }
    if (i % 2 === 1 || i === 1) {
      weights.push({ date, kg: Math.round((start - (13 - i) * 0.12 + ((i * 7) % 3) * 0.1) * 10) / 10 })
    }
  }
  return { diary, weights }
}
