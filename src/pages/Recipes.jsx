import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RECIPES } from '../data/recipes.js'
import { RecipeCard } from '../components/Cards.jsx'
import { MacroDonut, MacroLegend, Empty, FoodImage, Icon } from '../components/ui.jsx'
import { AddFoodModal } from '../components/AddFoodModal.jsx'
import { getFood, getRecipe, recipeAsFood, recipeTotals, scaleFood, fmt, normalize } from '../lib/nutrition.js'

const TAG_GROUPS = [
  ['Chod', ['raňajky', 'desiata', 'obed', 'večera']],
  ['Diéta', ['vegetariánske', 'vegánske', 'high-protein']],
  ['Ostatné', ['sladké']],
]

export function RecipeList() {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState([])
  const toggle = (t) => setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
  const list = useMemo(() => {
    const nq = normalize(q.trim())
    return RECIPES.filter((r) => {
      if (!selected.every((t) => r.tags.includes(t))) return false
      if (!nq) return true
      return normalize(r.name).includes(nq) || r.ingredients.some(([id]) => normalize(getFood(id)?.name || '').includes(nq))
    })
  }, [q, selected])
  return (
    <div className="panel">
      <div className="page-head">
        <h1>Recepty</h1>
      </div>
      <p className="muted small lead">Zdravé recepty s nutričnými hodnotami vypočítanými zo surovín.</p>
      <div className="input-icon">
        <Icon name="search" />
        <input type="search" placeholder="Hľadaj v názve alebo ingredienciách" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Hľadať recept" />
      </div>
      <div className="tag-groups">
        {TAG_GROUPS.map(([title, tags]) => (
          <fieldset key={title} className="tag-group">
            <legend>{title}</legend>
            {tags.map((t) => (
              <button key={t} type="button" className={`tag-option ${selected.includes(t) ? 'active' : ''}`} aria-pressed={selected.includes(t)} onClick={() => toggle(t)}>
                {t}
              </button>
            ))}
          </fieldset>
        ))}
      </div>
      {list.length ? (
        <div className="recipe-grid">
          {list.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <Empty icon="🧑‍🍳" title="Žiadny recept nezodpovedá filtru" />
      )}
    </div>
  )
}

export function RecipeDetail() {
  const { id } = useParams()
  const recipe = getRecipe(id)
  const [portions, setPortions] = useState(recipe?.portions ?? 1)
  const [adding, setAdding] = useState(false)
  if (!recipe) {
    return (
      <div className="panel">
        <Empty icon="🤷" title="Recept sa nenašiel">
          <Link to="/recepty">Späť na recepty</Link>
        </Empty>
      </div>
    )
  }
  const { totals, grams } = recipeTotals(recipe)
  const per = (v) => v / recipe.portions
  const factor = portions / recipe.portions
  const asFood = recipeAsFood(recipe)

  return (
    <div className="panel">
      <nav className="breadcrumb" aria-label="Omrvinková navigácia">
        <Link to="/recepty">Recepty</Link>
        <span>›</span>
        <span aria-current="page">{recipe.name}</span>
      </nav>
      <div className="detail-grid">
        <div className="card detail-main">
          <div className="detail-head">
            <div className="detail-img">{recipe.emoji}</div>
            <div className="grow">
              <h1>{recipe.name}</h1>
              <div className="muted">
                ⏱ {recipe.time} min · {recipe.portions} {recipe.portions === 1 ? 'porcia' : recipe.portions < 5 ? 'porcie' : 'porcií'} · {fmt(grams / recipe.portions, 0)} g / porcia
              </div>
              <div className="tags">
                {recipe.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="plan-grid four">
            <div className="plan-tile energy">
              <span>Energia / porcia</span>
              <strong>{fmt(per(totals.kcal), 0)} kcal</strong>
            </div>
            <div className="plan-tile protein">
              <span>Bielkoviny</span>
              <strong>{fmt(per(totals.protein))} g</strong>
            </div>
            <div className="plan-tile carbs">
              <span>Sacharidy</span>
              <strong>{fmt(per(totals.carbs))} g</strong>
            </div>
            <div className="plan-tile fat">
              <span>Tuky</span>
              <strong>{fmt(per(totals.fat))} g</strong>
            </div>
          </div>
          <button className="btn primary" onClick={() => setAdding(true)}>
            ✎ Zapísať porciu do jedálnička
          </button>

          <div className="section-head">
            <h2>Suroviny</h2>
            <label className="row gap small">
              Porcie
              <input type="number" min="1" max="50" value={portions} onChange={(e) => setPortions(Math.max(1, Number(e.target.value) || 1))} className="qty-input small" />
            </label>
          </div>
          <ul className="ingredients">
            {recipe.ingredients.map(([foodId, g]) => {
              const f = getFood(foodId)
              if (!f) return null
              return (
                <li key={foodId}>
                  <Link to={`/potraviny/${f.id}`}>
                    <FoodImage food={f} className="thumb" />
                    <span className="grow">{f.name}</span>
                    <strong>{fmt(g * factor, 0)} g</strong>
                    <span className="muted small">{fmt(scaleFood(f, g * factor).kcal, 0)} kcal</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <h2>Postup</h2>
          <ol className="steps">
            {recipe.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
        <aside className="detail-side">
          <div className="card center">
            <h3>Zloženie energie</h3>
            <MacroDonut protein={totals.protein} carbs={totals.carbs} fat={totals.fat} label={`${fmt(per(totals.kcal), 0)} kcal`} />
            <MacroLegend protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
          </div>
        </aside>
      </div>
      {adding && <AddFoodModal food={asFood} initial={{ qty: 1, unit: 'porcia' }} onClose={() => setAdding(false)} />}
    </div>
  )
}
