import { FOODS } from '../data/foods.js'
import { RECIPES } from '../data/recipes.js'
import { ACTIVITIES } from '../data/activities.js'

export const NUTRIENTS = [
  { key: 'kcal', label: 'Energia', unit: 'kcal' },
  { key: 'protein', label: 'Bielkoviny', unit: 'g' },
  { key: 'carbs', label: 'Sacharidy', unit: 'g' },
  { key: 'sugar', label: 'z toho cukry', unit: 'g', sub: true },
  { key: 'fat', label: 'Tuky', unit: 'g' },
  { key: 'satFat', label: 'z toho nasýtené MK', unit: 'g', sub: true },
  { key: 'fiber', label: 'Vláknina', unit: 'g' },
  { key: 'salt', label: 'Soľ', unit: 'g' },
]

export const MACRO_COLORS = {
  protein: 'var(--c-protein)',
  carbs: 'var(--c-carbs)',
  fat: 'var(--c-fat)',
  fiber: 'var(--c-fiber)',
}

export const MEALS = [
  { id: 'ranajky', name: 'Raňajky', icon: '🌅' },
  { id: 'desiata', name: 'Desiata', icon: '🍎' },
  { id: 'obed', name: 'Obed', icon: '🍽️' },
  { id: 'olovrant', name: 'Olovrant', icon: '🥨' },
  { id: 'vecera', name: 'Večera', icon: '🌙' },
  { id: 'druha-vecera', name: 'Druhá večera', icon: '🌜' },
]

export const ACTIVITY_LEVELS = [
  { id: 'sedavy', name: 'Sedavý', desc: 'Kancelária, takmer žiadny pohyb', factor: 1.2 },
  { id: 'lahko', name: 'Ľahko aktívny', desc: 'Pohyb 1–3× týždenne', factor: 1.375 },
  { id: 'stredne', name: 'Stredne aktívny', desc: 'Šport 3–5× týždenne', factor: 1.55 },
  { id: 'velmi', name: 'Veľmi aktívny', desc: 'Tvrdý tréning 6–7× týždenne', factor: 1.725 },
  { id: 'extremne', name: 'Extrémne aktívny', desc: 'Fyzická práca + tréning', factor: 1.9 },
]

export const GOALS = [
  { id: 'schudnut', name: 'Schudnúť' },
  { id: 'nabrat', name: 'Nabrať svaly' },
  { id: 'fit', name: 'Byť fit' },
]

const foodMap = new Map(FOODS.map((f) => [f.id, f]))
const activityMap = new Map(ACTIVITIES.map((a) => [a.id, a]))

export function getFood(id, customFoods = []) {
  return foodMap.get(id) || customFoods.find((f) => f.id === id) || null
}

export function getActivity(id) {
  return activityMap.get(id) || null
}

export function allFoods(customFoods = []) {
  return [...FOODS, ...customFoods]
}

/** Nutričné hodnoty pre dané množstvo gramov potraviny. */
export function scaleFood(food, grams) {
  const r = grams / 100
  const out = {}
  for (const n of NUTRIENTS) out[n.key] = (food[n.key] || 0) * r
  return out
}

export function emptyTotals() {
  return Object.fromEntries(NUTRIENTS.map((n) => [n.key, 0]))
}

export function addTotals(a, b) {
  const out = { ...a }
  for (const n of NUTRIENTS) out[n.key] = (a[n.key] || 0) + (b[n.key] || 0)
  return out
}

export function recipeTotals(recipe, customFoods = []) {
  let totals = emptyTotals()
  let grams = 0
  for (const [foodId, g] of recipe.ingredients) {
    const f = getFood(foodId, customFoods)
    if (!f) continue
    totals = addTotals(totals, scaleFood(f, g))
    grams += g
  }
  return { totals, grams }
}

/** Recept prevedený na „potravinu“ s hodnotami na 100 g, aby sa dal zapísať ako bežná položka. */
export function recipeAsFood(recipe) {
  const { totals, grams } = recipeTotals(recipe)
  const per100 = {}
  for (const n of NUTRIENTS) per100[n.key] = grams ? (totals[n.key] / grams) * 100 : 0
  return {
    id: `recipe:${recipe.id}`,
    name: recipe.name,
    emoji: recipe.emoji,
    category: 'recept',
    ...per100,
    units: [
      ['g', 1],
      ['porcia', Math.round(grams / recipe.portions)],
    ],
  }
}

export function getRecipe(id) {
  return RECIPES.find((r) => r.id === id) || null
}

export function resolveFood(id, customFoods = []) {
  if (id.startsWith('recipe:')) {
    const r = getRecipe(id.slice(7))
    return r ? recipeAsFood(r) : null
  }
  return getFood(id, customFoods)
}

/** Súčty za deň: prijatá energia a živiny, spálené kcal, voda. */
export function dayTotals(day, customFoods = []) {
  let totals = emptyTotals()
  if (!day) return { totals, burned: 0, water: 0 }
  for (const e of day.foods) {
    const f = resolveFood(e.foodId, customFoods)
    if (f) totals = addTotals(totals, scaleFood(f, e.grams))
  }
  const burned = day.activities.reduce((s, a) => s + a.kcal, 0)
  return { totals, burned, water: day.water || 0 }
}

export function activityKcal(activity, minutes, weightKg) {
  return activity.kcalPerKgMin * minutes * weightKg
}

export function ageFromBirthYear(year) {
  return new Date().getFullYear() - year
}

/** Bazálny metabolizmus podľa Mifflin-St Jeor. */
export function bmr({ sex, weight, height, birthYear }) {
  const age = ageFromBirthYear(birthYear)
  return 10 * weight + 6.25 * height - 5 * age + (sex === 'muz' ? 5 : -161)
}

export function bmi(weight, heightCm) {
  const m = heightCm / 100
  return weight / (m * m)
}

export function bmiLabel(v) {
  if (v < 18.5) return 'Podváha'
  if (v < 25) return 'Normálna hmotnosť'
  if (v < 30) return 'Nadváha'
  return 'Obezita'
}

/** Vypočíta denný plán: energia, makroživiny a časovú os k cieľovej hmotnosti. */
export function computePlan(profile) {
  const level = ACTIVITY_LEVELS.find((l) => l.id === profile.activity) || ACTIVITY_LEVELS[1]
  const base = bmr(profile)
  const tdee = base * level.factor
  const rate = Number(profile.rate) || 0.5 // kg za týždeň
  let target = profile.targetWeight
  let goal = profile.goal
  if (goal === 'fit') target = profile.weight

  const diff = target - profile.weight
  const dailyDelta = (7700 * rate) / 7
  let kcal = tdee
  if (goal === 'schudnut' && diff < 0) kcal = tdee - dailyDelta
  if (goal === 'nabrat') kcal = tdee + Math.min(dailyDelta, 400)
  const minKcal = profile.sex === 'muz' ? 1500 : 1200
  kcal = Math.max(minKcal, kcal)

  const proteinPerKg = goal === 'nabrat' ? 1.8 : goal === 'schudnut' ? 1.6 : 1.4
  const protein = proteinPerKg * Math.min(profile.weight, Math.max(target, profile.weight * 0.85))
  const fat = (kcal * 0.3) / 9
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4)
  const fiber = (kcal / 1000) * 14

  const weeks = rate > 0 && goal !== 'fit' ? Math.abs(diff) / rate : 0
  const today = new Date()
  const targetDate = new Date(today.getTime() + weeks * 7 * 86400000)
  const milestoneKg = diff === 0 ? null : profile.weight + Math.sign(diff) * Math.min(Math.abs(diff), 2)
  const milestoneDate = milestoneKg === null ? null : new Date(today.getTime() + (Math.abs(milestoneKg - profile.weight) / rate) * 7 * 86400000)

  return {
    bmr: base,
    tdee,
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    fiber: Math.round(fiber * 10) / 10,
    water: Math.round((profile.weight * 35) / 250) * 250,
    weeks,
    targetDate,
    target,
    milestoneKg,
    milestoneDate,
    rate,
    direction: goal === 'fit' || diff === 0 ? 'udrziavat' : diff < 0 ? 'chudnut' : 'pribrat',
  }
}

const nf1 = new Intl.NumberFormat('sk-SK', { maximumFractionDigits: 1 })
const nf0 = new Intl.NumberFormat('sk-SK', { maximumFractionDigits: 0 })

export function fmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '–'
  return digits === 0 ? nf0.format(n) : nf1.format(n)
}

export function fmtDate(d, opts = { day: 'numeric', month: 'long' }) {
  return new Date(d).toLocaleDateString('sk-SK', opts)
}

export function normalize(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
