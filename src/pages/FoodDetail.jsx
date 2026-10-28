import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES, FOODS } from '../data/foods.js'
import { NUTRIENTS, scaleFood, fmt, getFood } from '../lib/nutrition.js'
import { useStore, useToast } from '../store/AppStore.jsx'
import { MacroDonut, Empty, FoodImage, Icon, StoreBadges } from '../components/ui.jsx'
import { AddFoodModal } from '../components/AddFoodModal.jsx'

const NUTRI_COLORS = { a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11' }

export default function FoodDetail() {
  const { id } = useParams()
  const { state, dispatch, plan } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const food = getFood(id, state.customFoods)
  const [qty, setQty] = useState(100)
  const [unit, setUnit] = useState('g')
  const [adding, setAdding] = useState(null)

  if (!food) {
    return (
      <div className="panel">
        <Empty icon="🤷" title="Potravina sa nenašla">
          <Link to="/potraviny">Späť na tabuľku potravín</Link>
        </Empty>
      </div>
    )
  }

  const category = CATEGORIES.find((c) => c.id === food.category)
  const unitGrams = food.units.find((u) => u[0] === unit)?.[1] ?? 1
  const grams = Math.max(0, Number(qty) || 0) * unitGrams
  const n = scaleFood(food, grams)
  const daily = { kcal: plan.kcal, protein: plan.protein, carbs: plan.carbs, fat: plan.fat, fiber: plan.fiber, sugar: 50, satFat: Math.round((plan.kcal * 0.1) / 9), salt: 5 }
  const fav = state.favorites.includes(food.id)
  const similar = FOODS.filter((f) => f.category === food.category && f.id !== food.id && (f.img || f.generic)).slice(0, 6)
  const macroKcal = food.protein * 4 + food.carbs * 4 + food.fat * 9 || 1

  return (
    <div className="panel">
      <nav className="breadcrumb" aria-label="Omrvinková navigácia">
        <Link to="/potraviny">Potraviny</Link>
        <Icon name="chevron_right" />
        {category ? <Link to={`/potraviny?kategoria=${category.id}`}>{category.name}</Link> : <span>Vlastné</span>}
        <Icon name="chevron_right" />
        <span aria-current="page">{food.name}</span>
      </nav>

      <div className="detail-top">
        <div className="detail-photo">
          <FoodImage food={food} />
        </div>
        <div className="detail-title">
          <h1>
            {food.name}
            <button
              className={`fav-btn ${fav ? 'on' : ''}`}
              onClick={() => {
                dispatch({ type: 'favorite/toggle', id: food.id })
                toast(fav ? 'Odstránené z obľúbených' : 'Pridané do obľúbených')
              }}
              aria-pressed={fav}
              aria-label="Obľúbená potravina"
              title="Obľúbená"
            >
              <Icon name="star" fill={fav} />
            </button>
          </h1>
          {(food.brand || food.stores) && (
            <div className="detail-brand">
              {food.brand && <span>{food.brand}</span>}
              {food.qty && <span className="muted">· {food.qty}</span>}
              <StoreBadges stores={food.stores} max={6} />
            </div>
          )}
          <div className="detail-sub">Zadaj množstvo a jednotku</div>
          <div className="qty-row">
            <input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Množstvo" className="qty-input" />
            <span className="op">×</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Jednotka" className="unit-select">
              {food.units.map(([u, g]) => (
                <option key={u} value={u}>
                  {u === 'g' ? '1 g' : `${u} (${fmt(g, 0)} g)`}
                </option>
              ))}
            </select>
            <span className="op eq">= {fmt(grams, 0)} g</span>
            <button className="btn primary big-btn" onClick={() => setAdding({ qty: Number(qty) || 100, unit })}>
              <Icon name="edit" /> Zapísať do jedálnička
            </button>
          </div>
        </div>
      </div>

      <div className="tile-row">
        <div className="tile">
          <strong>{fmt(n.kcal, 0)} kcal</strong>
          <span>Taktiež {fmt(n.kcal * 4.184, 0)} kJ • Energetická hodnota</span>
        </div>
        <div className="tile">
          <strong>{fmt((n.kcal / plan.kcal) * 100, 0)}%</strong>
          <span>Z odporúčaného denného príjmu</span>
        </div>
      </div>

      <div className="detail-cols">
        <div>
          <ul className="nutrients">
            {NUTRIENTS.filter((x) => x.key !== 'kcal').map((x) => (
              <li key={x.key} className={x.sub ? 'sub' : ''}>
                <div className="nutrient-row">
                  <span>
                    {!x.sub && <span className={`dot ${x.key}`} />}
                    {x.label}
                  </span>
                  <strong>
                    {fmt(n[x.key], n[x.key] < 1 && n[x.key] > 0 ? 2 : 1)} {x.unit}
                  </strong>
                </div>
                {!x.sub && daily[x.key] ? (
                  <div className="nutrient-rdi">
                    Odporúčaný denný príjem: {fmt(daily[x.key], 0)} {x.unit}
                    <span className="rdi-bar">
                      <span style={{ width: `${Math.min(100, (n[x.key] / daily[x.key]) * 100)}%` }} />
                    </span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {food.custom && (
            <button
              className="btn danger small"
              onClick={() => {
                dispatch({ type: 'custom/remove', id: food.id })
                toast('Potravina odstránená')
                navigate('/potraviny')
              }}
            >
              Odstrániť vlastnú potravinu
            </button>
          )}
        </div>

        <div>
          <h3 className="box-title">Zloženie nutričných hodnôt</h3>
          <div className="composition">
            <MacroDonut protein={food.protein} carbs={food.carbs} fat={food.fat} size={170} />
            <ul className="composition-list">
              <li>
                <span className="dot protein" />
                Bielkoviny <strong>{fmt(((food.protein * 4) / macroKcal) * 100, 0)} %</strong>
              </li>
              <li>
                <span className="dot carbs" />
                Sacharidy <strong>{fmt(((food.carbs * 4) / macroKcal) * 100, 0)} %</strong>
              </li>
              <li className="sub">
                Cukry <strong>{fmt(((food.sugar * 4) / macroKcal) * 100, 0)} %</strong>
              </li>
              <li>
                <span className="dot fat" />
                Tuky <strong>{fmt(((food.fat * 9) / macroKcal) * 100, 0)} %</strong>
              </li>
              <li className="sub">
                Nasýtené mastné kyseliny <strong>{fmt(((food.satFat * 9) / macroKcal) * 100, 0)} %</strong>
              </li>
            </ul>
          </div>

          {(food.code || food.ns) && (
            <div className="info-box">
              <h3 className="box-title">O produkte</h3>
              {food.ns && (
                <div className="nutriscore">
                  Nutri-Score
                  <span style={{ background: NUTRI_COLORS[food.ns] }}>{food.ns.toUpperCase()}</span>
                </div>
              )}
              {food.code && <div className="muted small">EAN {food.code}</div>}
              {food.code && (
                <a className="small" href={`https://world.openfoodfacts.org/product/${food.code}`} target="_blank" rel="noreferrer">
                  Zdroj: Open Food Facts <Icon name="open_in_new" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="similar-section">
          <h3 className="box-title">
            Najhľadanejšie v kategórii <Link to={`/potraviny?kategoria=${food.category}`}>{category?.name}</Link>
          </h3>
          <ul className="similar">
            {similar.map((f) => (
              <li key={f.id}>
                <Link to={`/potraviny/${f.id}`} className="similar-main">
                  <FoodImage food={f} className="thumb lg" />
                  <span className="grow">
                    <span className="ellipsis strong">{f.name}</span>
                    <span className="muted small">{f.brand || category?.name}</span>
                  </span>
                  <span className="strong nowrap">{fmt(f.kcal, 0)} kcal</span>
                </Link>
                <Link to={`/potraviny/${f.id}`} className="write-link">
                  Zapísať
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {adding && <AddFoodModal food={food} initial={adding} onClose={() => setAdding(null)} />}
    </div>
  )
}
