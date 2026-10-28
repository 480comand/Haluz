import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CATEGORIES, STORES } from '../data/foods.js'
import { allFoods, fmt, normalize } from '../lib/nutrition.js'
import { useStore, useToast } from '../store/AppStore.jsx'
import { Pagination, Modal, Empty, FoodImage, Icon, StoreBadges } from '../components/ui.jsx'
import { AddFoodModal } from '../components/AddFoodModal.jsx'

const SORTS = [
  ['name', 'Názov'],
  ['kcal', 'Energetická hodnota (kcal)'],
  ['protein', 'Bielkoviny (g)'],
  ['carbs', 'Sacharidy (g)'],
  ['fat', 'Tuky (g)'],
]

function CustomFoodModal({ onClose }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ name: '', emoji: '🍽️', category: 'jedla', kcal: '', protein: '', carbs: '', sugar: '', fat: '', satFat: '', fiber: '', salt: '', unitName: '', unitGrams: '' })
  const num = (k) => Math.max(0, Number(String(f[k]).replace(',', '.')) || 0)
  const submit = (e) => {
    e.preventDefault()
    const units = [['g', 1]]
    if (f.unitName && num('unitGrams') > 0) units.push([f.unitName, num('unitGrams')])
    dispatch({
      type: 'custom/add',
      food: {
        name: f.name.trim(),
        emoji: f.emoji || '🍽️',
        category: f.category,
        ...Object.fromEntries(['kcal', 'protein', 'carbs', 'sugar', 'fat', 'satFat', 'fiber', 'salt'].map((k) => [k, num(k)])),
        units,
      },
    })
    toast('Vlastná potravina pridaná')
    onClose()
  }
  const input = (k, label, props = {}) => (
    <label className="field">
      <span>{label}</span>
      <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} inputMode="decimal" {...props} />
    </label>
  )
  return (
    <Modal title="Nová vlastná potravina" onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <div className="span-2 row gap">
          <label className="field" style={{ width: 80 }}>
            <span>Ikona</span>
            <input value={f.emoji} maxLength={4} onChange={(e) => setF({ ...f, emoji: e.target.value })} />
          </label>
          <label className="field grow">
            <span>Názov *</span>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
          </label>
        </div>
        <label className="field span-2">
          <span>Kategória</span>
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <p className="span-2 muted small">Hodnoty zadaj na 100 g (nájdeš ich na etikete).</p>
        {input('kcal', 'Energia (kcal) *', { required: true })}
        {input('protein', 'Bielkoviny (g)')}
        {input('carbs', 'Sacharidy (g)')}
        {input('sugar', 'z toho cukry (g)')}
        {input('fat', 'Tuky (g)')}
        {input('satFat', 'z toho nasýtené (g)')}
        {input('fiber', 'Vláknina (g)')}
        {input('salt', 'Soľ (g)')}
        {input('unitName', 'Vlastná jednotka (napr. ks)', { inputMode: 'text' })}
        {input('unitGrams', 'Hmotnosť jednotky (g)')}
        <button className="btn primary block span-2" type="submit">
          Uložiť potravinu
        </button>
      </form>
    </Modal>
  )
}

export default function Foods() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const cat = params.get('kategoria') || ''
  const store = params.get('obchod') || ''
  const [sort, setSort] = useState(['default', 1])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [adding, setAdding] = useState(null)
  const [creating, setCreating] = useState(false)

  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
    setPage(1)
  }

  const list = useMemo(() => {
    const nq = normalize(q.trim())
    let l = allFoods(state.customFoods)
    if (store === 'vlastne') l = l.filter((f) => f.custom)
    else if (store === 'oblubene') l = l.filter((f) => state.favorites.includes(f.id))
    else if (store === 'zakladne') l = l.filter((f) => f.generic)
    else if (store) l = l.filter((f) => f.stores?.includes(store))
    if (cat) l = l.filter((f) => f.category === cat)
    if (nq) l = l.filter((f) => normalize(`${f.name} ${f.brand || ''}`).includes(nq))
    const [key, dir] = sort
    if (key === 'default') return l
    return [...l].sort((a, b) => (key === 'name' ? a.name.localeCompare(b.name, 'sk') : a[key] - b[key]) * dir)
  }, [q, cat, store, sort, state.customFoods, state.favorites])

  const pages = Math.max(1, Math.ceil(list.length / perPage))
  const current = Math.min(page, pages)
  const shown = list.slice((current - 1) * perPage, current * perPage)
  const sortBy = (key) => setSort(([k, d]) => [key, k === key ? -d : key === 'name' ? 1 : -1])

  const tabs = [
    ['', 'Všetky'],
    ['zakladne', 'Základné'],
    ...STORES.slice(0, 7).map((s) => [s.name, s.name]),
    ['oblubene', 'Obľúbené'],
    ['vlastne', 'Vlastné'],
  ]

  return (
    <div className="panel flush">
      <div className="tabs-bar" role="tablist" aria-label="Obchod">
        {tabs.map(([id, name]) => (
          <button key={id || 'all'} role="tab" aria-selected={store === id} className={store === id ? 'active' : ''} onClick={() => setParam('obchod', id)}>
            {name}
          </button>
        ))}
      </div>
      <div className="panel-body">
        <div className="page-head">
          <h1>Tabuľka potravín</h1>
          <button className="btn" onClick={() => setCreating(true)}>
            <Icon name="add" /> Vlastná potravina
          </button>
        </div>
        <p className="muted small lead">
          Reálne produkty zo slovenských obchodov a základné potraviny. Kliknutím na názov zobrazíš všetky nutričné hodnoty.
        </p>
        <div className="filter-row">
          <div className="input-icon grow">
            <Icon name="search" />
            <input type="search" placeholder="Hľadaj v názve potraviny alebo značky" value={q} onChange={(e) => setParam('q', e.target.value)} aria-label="Hľadať potravinu" />
          </div>
          <select value={cat} onChange={(e) => setParam('kategoria', e.target.value)} aria-label="Kategória" className="filter-select">
            <option value="">Všetky kategórie</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {list.length === 0 ? (
          <Empty icon="🔎" title="Žiadna potravina nezodpovedá filtru">
            Skús iný výraz alebo si pridaj vlastnú potravinu.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {SORTS.map(([k, label]) => (
                    <th key={k} className={`${k === 'name' ? '' : 'num'} ${k === 'protein' || k === 'carbs' || k === 'fat' ? 'hide-sm' : ''}`}>
                      <button className="th-btn" onClick={() => sortBy(k)} aria-sort={sort[0] === k ? (sort[1] > 0 ? 'ascending' : 'descending') : 'none'}>
                        {label}
                        {sort[0] === k && <Icon name={sort[1] > 0 ? 'arrow_upward' : 'arrow_downward'} />}
                      </button>
                    </th>
                  ))}
                  <th aria-label="Akcie" />
                </tr>
              </thead>
              <tbody>
                {shown.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <Link to={`/potraviny/${f.id}`} className="food-link">
                        <FoodImage food={f} className="thumb" />
                        <span className="food-link-text">
                          <span className="food-link-name">
                            {f.name}
                            {f.custom && <span className="tag tiny">vlastná</span>}
                          </span>
                          {(f.brand || f.stores) && (
                            <span className="muted small">
                              {f.brand} <StoreBadges stores={f.stores} max={2} />
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="num strong">{fmt(f.kcal, 0)}</td>
                    <td className="num hide-sm">{fmt(f.protein)}</td>
                    <td className="num hide-sm">{fmt(f.carbs)}</td>
                    <td className="num hide-sm">{fmt(f.fat)}</td>
                    <td className="num">
                      <button className="write-btn" onClick={() => setAdding(f)} aria-label={`Zapísať ${f.name}`}>
                        <Icon name="edit" />
                        <span className="hide-sm">Zapísať</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-foot">
          <label className="muted small">
            Na stránku:{' '}
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <span className="muted small">
            {list.length ? (current - 1) * perPage + 1 : 0} - {Math.min(current * perPage, list.length)} z {fmt(list.length, 0)}
          </span>
          <Pagination page={current} pages={pages} onChange={setPage} />
        </div>
      </div>
      {adding && <AddFoodModal food={adding} onClose={() => setAdding(null)} />}
      {creating && <CustomFoodModal onClose={() => setCreating(false)} />}
    </div>
  )
}
