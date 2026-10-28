import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ACTIVITIES, ACTIVITY_CATEGORIES } from '../data/activities.js'
import { activityKcal, fmt, normalize } from '../lib/nutrition.js'
import { useStore, useToast } from '../store/AppStore.jsx'
import { Modal, Pagination, Empty } from '../components/ui.jsx'
import { toKey } from '../lib/date.js'

export function AddActivityModal({ activity, date: initialDate, onClose }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [minutes, setMinutes] = useState(30)
  const [date, setDate] = useState(initialDate || toKey())
  const kcal = activityKcal(activity, Number(minutes) || 0, state.profile.weight)
  return (
    <Modal title="Zapísať aktivitu" onClose={onClose}>
      <form
        className="amount-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!(Number(minutes) > 0)) return
          dispatch({ type: 'activity/add', date, entry: { activityId: activity.id, minutes: Number(minutes), kcal: Math.round(kcal) } })
          toast(`${activity.name} zapísané`)
          onClose()
        }}
      >
        <div className="amount-head">
          <span className="food-emoji lg">🏃</span>
          <div>
            <strong>{activity.name}</strong>
            <div className="muted small">
              {activity.category} · {fmt(activity.kcalPerKgMin, 3)} kcal/kg/min
            </div>
          </div>
        </div>
        <div className="row gap">
          <label className="field grow">
            <span>Trvanie (min)</span>
            <input type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} required />
          </label>
          {!initialDate && (
            <label className="field grow">
              <span>Dátum</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
          )}
        </div>
        <div className="quick-row">
          {[15, 30, 45, 60, 90].map((m) => (
            <button type="button" key={m} className={`chip-btn ${Number(minutes) === m ? 'active' : ''}`} onClick={() => setMinutes(m)}>
              {m} min
            </button>
          ))}
        </div>
        <div className="amount-summary">
          <div>
            <span className="big">−{fmt(kcal, 0)}</span> kcal
            <span className="muted"> pri hmotnosti {fmt(state.profile.weight, 1)} kg</span>
          </div>
        </div>
        <button className="btn primary block" type="submit">
          Zapísať aktivitu
        </button>
      </form>
    </Modal>
  )
}

export function ActivityPickerModal({ date, onClose }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const list = ACTIVITIES.filter((a) => normalize(a.name).includes(normalize(q.trim())))
  if (picked) return <AddActivityModal activity={picked} date={date} onClose={onClose} />
  return (
    <Modal title="Pridať aktivitu" onClose={onClose}>
      <input className="search-input" placeholder="Hľadaj aktivitu…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <ul className="pick-list">
        {list.map((a) => (
          <li key={a.id}>
            <button onClick={() => setPicked(a)}>
              <span className="food-emoji">🏃</span>
              <span className="grow">{a.name}</span>
              <span className="muted small">{a.category}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export default function Activities() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [cat, setCat] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(null)
  const perPage = 15

  const list = useMemo(
    () => ACTIVITIES.filter((a) => (!cat || a.category === cat) && normalize(a.name).includes(normalize(q.trim()))),
    [q, cat],
  )
  const pages = Math.max(1, Math.ceil(list.length / perPage))
  const current = Math.min(page, pages)

  return (
    <div className="panel">
      <div className="page-head">
        <h1>Katalóg aktivít</h1>
      </div>
      <div className="filters">
        <input
          className="search-input"
          type="search"
          placeholder="Hľadaj v názve aktivity"
          value={q}
          onChange={(e) => {
            setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })
            setPage(1)
          }}
          aria-label="Hľadať aktivitu"
        />
        <div className="chips-scroll">
          <button className={`chip-btn ${!cat ? 'active' : ''}`} onClick={() => setCat('')}>
            Všetky
          </button>
          {ACTIVITY_CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip-btn ${cat === c ? 'active' : ''}`}
              onClick={() => {
                setCat(c)
                setPage(1)
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <Empty icon="🏃" title="Žiadna aktivita nezodpovedá filtru" />
      ) : (
        <div className="table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Názov</th>
                <th className="hide-sm">Kategória</th>
                <th className="num">kcal/kg/min</th>
                <th className="num">30 min pre {fmt(state.profile.weight, 0)} kg</th>
                <th aria-label="Akcie" />
              </tr>
            </thead>
            <tbody>
              {list.slice((current - 1) * perPage, current * perPage).map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className="hide-sm muted">{a.category}</td>
                  <td className="num">{fmt(a.kcalPerKgMin, 3)}</td>
                  <td className="num strong">{fmt(activityKcal(a, 30, state.profile.weight), 0)} kcal</td>
                  <td className="num">
                    <button className="btn small" onClick={() => setAdding(a)}>
                      Zapísať
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="table-foot">
        <span className="muted small">
          {list.length ? (current - 1) * perPage + 1 : 0} – {Math.min(current * perPage, list.length)} z {list.length}
        </span>
        <Pagination page={current} pages={pages} onChange={setPage} />
      </div>
      {adding && <AddActivityModal activity={adding} onClose={() => setAdding(null)} />}
    </div>
  )
}
