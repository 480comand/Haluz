import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MEALS, dayTotals, resolveFood, scaleFood, getActivity, fmt, MACRO_COLORS } from '../lib/nutrition.js'
import { useStore, useToast } from '../store/AppStore.jsx'
import { toKey, addDays, dayLabel } from '../lib/date.js'
import { EnergyRing, ProgressBar, Modal, FoodImage, Icon } from '../components/ui.jsx'
import { FoodPickerModal, AmountForm } from '../components/AddFoodModal.jsx'
import { ActivityPickerModal } from './Activities.jsx'

const GLASS = 250

function WaterCard({ date, water, goal }) {
  const { dispatch } = useStore()
  const glasses = Math.max(8, Math.ceil(goal / GLASS))
  const filled = Math.floor(water / GLASS)
  const set = (ml) => dispatch({ type: 'water/set', date, ml })
  return (
    <div className="card">
      <div className="section-head tight">
        <h3>💧 Pitný režim</h3>
        <span className="muted small">
          {fmt(water / 1000, 2)} / {fmt(goal / 1000, 2)} l
        </span>
      </div>
      <div className="glasses">
        {Array.from({ length: glasses }, (_, i) => (
          <button
            key={i}
            className={`glass ${i < filled ? 'full' : ''}`}
            onClick={() => set(i < filled ? i * GLASS : (i + 1) * GLASS)}
            aria-label={`${i + 1}. pohár`}
            aria-pressed={i < filled}
          >
            <svg viewBox="0 0 24 32" width="24" height="32" aria-hidden="true">
              <path d="M3 3h18l-2.5 26h-13z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              {i < filled && <path d="M5 11h14l-1.8 17h-10.4z" fill="var(--water)" />}
            </svg>
          </button>
        ))}
      </div>
      <div className="row gap">
        <button className="btn small" onClick={() => set(water - GLASS)} disabled={water <= 0}>
          − 250 ml
        </button>
        <button className="btn small" onClick={() => set(water + GLASS)}>
          + 250 ml
        </button>
      </div>
    </div>
  )
}

function WeightCard({ date }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const existing = state.weights.find((w) => w.date === date)
  const [kg, setKg] = useState(existing?.kg ?? state.profile.weight)
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault()
        const v = Number(String(kg).replace(',', '.'))
        if (!(v > 20 && v < 400)) return
        dispatch({ type: 'weight/add', date, kg: v })
        toast('Hmotnosť zaznamenaná')
      }}
    >
      <div className="section-head tight">
        <h3>⚖️ Hmotnosť</h3>
        {existing && <span className="muted small">zapísané {fmt(existing.kg, 1)} kg</span>}
      </div>
      <div className="row gap">
        <input type="number" step="0.1" min="20" max="400" value={kg} onChange={(e) => setKg(e.target.value)} aria-label="Hmotnosť v kg" className="qty-input" />
        <span className="muted">kg</span>
        <button className="btn small primary" type="submit">
          Uložiť
        </button>
      </div>
    </form>
  )
}

export default function Diary() {
  const { state, dispatch, plan } = useStore()
  const toast = useToast()
  const [date, setDate] = useState(toKey())
  const [picker, setPicker] = useState(null)
  const [editing, setEditing] = useState(null)
  const [actPicker, setActPicker] = useState(false)
  const day = state.diary[date] || { foods: [], activities: [], water: 0 }
  const { totals, burned, water } = dayTotals(day, state.customFoods)
  const goalKcal = plan.kcal

  const copyYesterday = () => {
    const prev = state.diary[addDays(date, -1)]
    if (!prev || prev.foods.length === 0) {
      toast('Predchádzajúci deň je prázdny')
      return
    }
    for (const { id: _id, ...entry } of prev.foods) dispatch({ type: 'food/add', date, entry })
    toast(`Skopírovaných ${prev.foods.length} položiek`)
  }

  return (
    <div className="panel">
      {!state.profile.saved && (
        <div className="banner">
          Ciele sú zatiaľ predvolené. <Link to="/profil">Nastav si svoj plán</Link> pre presné hodnoty.
        </div>
      )}
      <div className="date-nav">
        <button className="icon-btn" onClick={() => setDate(addDays(date, -1))} aria-label="Predchádzajúci deň">
          <Icon name="keyboard_arrow_left" />
        </button>
        <label className="date-label">
          <strong>{dayLabel(date)}</strong>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Vybrať dátum" />
        </label>
        <button className="icon-btn" onClick={() => setDate(addDays(date, 1))} aria-label="Nasledujúci deň">
          <Icon name="keyboard_arrow_right" />
        </button>
        {date !== toKey() && (
          <button className="btn small" onClick={() => setDate(toKey())}>
            Dnes
          </button>
        )}
      </div>

      <div className="diary-grid">
        <div className="diary-main">
          <div className="card summary-card">
            <EnergyRing eaten={totals.kcal} burned={burned} goal={goalKcal} />
            <div className="summary-stats">
              <div>
                <span className="muted small">Príjem</span>
                <strong>{fmt(totals.kcal, 0)} kcal</strong>
              </div>
              <div>
                <span className="muted small">Výdaj aktivitami</span>
                <strong>{fmt(burned, 0)} kcal</strong>
              </div>
              <div>
                <span className="muted small">Denný cieľ</span>
                <strong>{fmt(goalKcal, 0)} kcal</strong>
              </div>
            </div>
            <div className="summary-bars">
              <ProgressBar label="Bielkoviny" value={totals.protein} max={plan.protein} color={MACRO_COLORS.protein} />
              <ProgressBar label="Sacharidy" value={totals.carbs} max={plan.carbs} color={MACRO_COLORS.carbs} />
              <ProgressBar label="Tuky" value={totals.fat} max={plan.fat} color={MACRO_COLORS.fat} />
              <ProgressBar label="Vláknina" value={totals.fiber} max={plan.fiber} color={MACRO_COLORS.fiber} />
            </div>
          </div>

          {MEALS.map((m) => {
            const entries = day.foods.filter((e) => e.meal === m.id)
            const mealKcal = entries.reduce((s, e) => {
              const f = resolveFood(e.foodId, state.customFoods)
              return s + (f ? scaleFood(f, e.grams).kcal : 0)
            }, 0)
            return (
              <section key={m.id} className="card meal">
                <div className="meal-head">
                  <h3>
                    <span aria-hidden="true">{m.icon}</span> {m.name}
                  </h3>
                  <span className="muted">{fmt(mealKcal, 0)} kcal</span>
                  <button className="btn small primary" onClick={() => setPicker(m.id)} aria-label={`Pridať do: ${m.name}`}>
                    ＋ Pridať
                  </button>
                </div>
                {entries.length > 0 && (
                  <ul className="entries">
                    {entries.map((e) => {
                      const f = resolveFood(e.foodId, state.customFoods)
                      if (!f) return null
                      const n = scaleFood(f, e.grams)
                      return (
                        <li key={e.id}>
                          <FoodImage food={f} className="thumb" />
                          <button className="entry-main" onClick={() => setEditing({ entry: e, food: f })}>
                            <span className="ellipsis">{f.name}</span>
                            <span className="muted small">
                              {e.unit === 'g' ? `${fmt(e.grams, 0)} g` : `${fmt(e.qty, 1)} ${e.unit} (${fmt(e.grams, 0)} g)`} · B {fmt(n.protein)} · S {fmt(n.carbs)} · T {fmt(n.fat)}
                            </span>
                          </button>
                          <strong className="entry-kcal">{fmt(n.kcal, 0)}</strong>
                          <button className="icon-btn subtle" onClick={() => dispatch({ type: 'food/remove', date, id: e.id })} aria-label={`Odstrániť ${f.name}`}>
                            <Icon name="delete" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )
          })}

          <section className="card meal">
            <div className="meal-head">
              <h3>
                <span aria-hidden="true">🏃</span> Aktivity
              </h3>
              <span className="muted">−{fmt(burned, 0)} kcal</span>
              <button className="btn small primary" onClick={() => setActPicker(true)}>
                ＋ Pridať
              </button>
            </div>
            {day.activities.length > 0 && (
              <ul className="entries">
                {day.activities.map((a) => {
                  const act = getActivity(a.activityId)
                  return (
                    <li key={a.id}>
                      <span className="food-emoji">🏃</span>
                      <span className="entry-main">
                        <span className="ellipsis">{act?.name ?? 'Aktivita'}</span>
                        <span className="muted small">{a.minutes} min</span>
                      </span>
                      <strong className="entry-kcal">−{fmt(a.kcal, 0)}</strong>
                      <button className="icon-btn subtle" onClick={() => dispatch({ type: 'activity/remove', date, id: a.id })} aria-label="Odstrániť aktivitu">
                        <Icon name="delete" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
          {day.foods.length === 0 && (
            <button className="btn block" onClick={copyYesterday}>
              ⧉ Skopírovať jedálniček z predchádzajúceho dňa
            </button>
          )}
        </div>
        <aside className="diary-side">
          <WaterCard date={date} water={water} goal={plan.water} />
          <WeightCard key={date} date={date} />
          <div className="card">
            <h3>Ďalšie živiny</h3>
            <ProgressBar label="Cukry" value={totals.sugar} max={50} color="var(--warn)" />
            <ProgressBar label="Nasýtené MK" value={totals.satFat} max={Math.round((plan.kcal * 0.1) / 9)} color="var(--c-fat)" />
            <ProgressBar label="Soľ" value={totals.salt} max={5} color="var(--text-muted)" />
          </div>
        </aside>
      </div>

      {picker && <FoodPickerModal date={date} meal={picker} onClose={() => setPicker(null)} />}
      {actPicker && <ActivityPickerModal date={date} onClose={() => setActPicker(false)} />}
      {editing && (
        <Modal title="Upraviť záznam" onClose={() => setEditing(null)}>
          <AmountForm
            food={editing.food}
            initial={{ ...editing.entry, date }}
            showDate={false}
            submitLabel="Uložiť zmeny"
            onSubmit={({ date: _d, foodId: _f, ...patch }) => {
              dispatch({ type: 'food/update', date, id: editing.entry.id, patch })
              toast('Záznam upravený')
              setEditing(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
