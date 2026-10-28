import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, useToast, buildDemoState } from '../store/AppStore.jsx'
import { lastNDays, fromKey, toKey } from '../lib/date.js'
import { dayTotals, fmt, fmtDate, bmi, bmiLabel } from '../lib/nutrition.js'
import { BarChart, LineChart, MacroDonut, MacroLegend, Empty, Icon } from '../components/ui.jsx'

export function DemoButton() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  return (
    <button
      className="btn"
      onClick={() => {
        const demo = buildDemoState(state.profile)
        const latest = demo.weights[demo.weights.length - 1]
        dispatch({
          type: 'state/replace',
          state: { ...state, diary: { ...demo.diary, ...state.diary }, weights: demo.weights, profile: { ...state.profile, weight: latest.kg } },
        })
        toast('Ukážkové dáta načítané')
      }}
    >
      ✨ Načítať ukážkové dáta
    </button>
  )
}

export default function Stats() {
  const { state, dispatch, plan } = useStore()
  const [range, setRange] = useState(7)
  const days = lastNDays(range)
  const rows = days.map((d) => ({ date: d, ...dayTotals(state.diary[d], state.customFoods) }))
  const logged = rows.filter((r) => r.totals.kcal > 0)
  const avg = (fn) => (logged.length ? logged.reduce((s, r) => s + fn(r), 0) / logged.length : 0)
  const avgKcal = avg((r) => r.totals.kcal)
  const avgP = avg((r) => r.totals.protein)
  const avgC = avg((r) => r.totals.carbs)
  const avgF = avg((r) => r.totals.fat)
  const totalBurned = rows.reduce((s, r) => s + r.burned, 0)
  const onTarget = logged.filter((r) => r.totals.kcal - r.burned <= plan.kcal * 1.05).length

  const chartData = rows.map((r) => {
    const d = fromKey(r.date)
    return {
      label: range <= 7 ? d.toLocaleDateString('sk-SK', { weekday: 'short' }) : d.getDate() % 5 === 0 || r.date === toKey() ? String(d.getDate()) : '',
      title: fmtDate(d),
      value: r.totals.kcal,
    }
  })

  const weights = state.weights
  const first = weights[0]
  const last = weights[weights.length - 1]
  const change = first && last ? last.kg - first.kg : 0
  const b = bmi(state.profile.weight, state.profile.height)
  const empty = Object.keys(state.diary).length === 0 && weights.length === 0

  return (
    <div className="panel">
      <div className="page-head">
        <h1>Štatistiky</h1>
        <div className="segmented small" role="radiogroup" aria-label="Obdobie">
          {[7, 14, 30].map((n) => (
            <button key={n} role="radio" aria-checked={range === n} className={range === n ? 'active' : ''} onClick={() => setRange(n)}>
              {n} dní
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <Empty icon="📈" title="Zatiaľ tu nič nie je">
          Začni zapisovať v <Link to="/jedalnicek">jedálničku</Link>, alebo si pozri, ako štatistiky vyzerajú s ukážkovými dátami.
          <br />
          <br />
          <DemoButton />
        </Empty>
      ) : (
        <>
          <div className="kpi-row">
            <div className="kpi card">
              <span className="muted small">Priemerný príjem</span>
              <strong>{fmt(avgKcal, 0)} kcal</strong>
              <span className={`small ${avgKcal > plan.kcal ? 'over' : 'ok'}`}>cieľ {fmt(plan.kcal, 0)} kcal</span>
            </div>
            <div className="kpi card">
              <span className="muted small">Dni v cieli</span>
              <strong>
                {onTarget} / {logged.length}
              </strong>
              <span className="muted small">príjem − aktivity ≤ cieľ</span>
            </div>
            <div className="kpi card">
              <span className="muted small">Spálené aktivitami</span>
              <strong>{fmt(totalBurned, 0)} kcal</strong>
              <span className="muted small">za {range} dní</span>
            </div>
            <div className="kpi card">
              <span className="muted small">Zmena hmotnosti</span>
              <strong className={change < 0 ? 'ok' : change > 0 ? 'over' : ''}>
                {change > 0 ? '+' : ''}
                {fmt(change, 1)} kg
              </strong>
              <span className="muted small">
                BMI {fmt(b, 1)} · {bmiLabel(b)}
              </span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="card">
              <div className="section-head tight">
                <h3>Príjem energie</h3>
                <span className="muted small">čiarkovaná čiara = denný cieľ</span>
              </div>
              <BarChart data={chartData} goal={plan.kcal} />
            </div>
            <div className="card center">
              <h3>Priemerné zloženie</h3>
              <MacroDonut protein={avgP} carbs={avgC} fat={avgF} label={`${fmt(avgKcal, 0)} kcal`} />
              <MacroLegend protein={avgP} carbs={avgC} fat={avgF} />
              <div className="muted small">
                B {fmt(avgP, 0)} g · S {fmt(avgC, 0)} g · T {fmt(avgF, 0)} g denne
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-head tight">
              <h3>Vývoj hmotnosti</h3>
              <Link to="/jedalnicek" className="more small">
                Zapísať hmotnosť ›
              </Link>
            </div>
            {weights.length ? (
              <>
                <LineChart
                  points={weights.map((w) => ({ label: fmtDate(fromKey(w.date)), value: w.kg }))}
                  target={state.profile.goal !== 'fit' ? state.profile.targetWeight : null}
                />
                <details className="weight-list">
                  <summary>Všetky záznamy ({weights.length})</summary>
                  <ul>
                    {[...weights].reverse().map((w) => (
                      <li key={w.date}>
                        <span>{fmtDate(fromKey(w.date), { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <strong>{fmt(w.kg, 1)} kg</strong>
                        <button className="icon-btn subtle" onClick={() => dispatch({ type: 'weight/remove', date: w.date })} aria-label="Odstrániť záznam">
                          <Icon name="delete" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p className="muted">Zatiaľ žiadne záznamy hmotnosti.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
