import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { fmt, recipeTotals } from '../lib/nutrition.js'
import { FoodImage, Icon, StoreBadges } from './ui.jsx'

export function FoodCard({ food }) {
  return (
    <Link to={`/potraviny/${food.id}`} className="food-card">
      <div className="food-card-img">
        <FoodImage food={food} />
        <StoreBadges stores={food.stores} max={2} />
      </div>
      <strong className="food-card-name">{food.name}</strong>
      <div className="food-card-kcal">{fmt(food.kcal, 1)} kcal • 100 g</div>
      <dl className="mini-macros">
        <div className="protein">
          <dt>Bielkoviny</dt>
          <dd>{fmt(food.protein)} g</dd>
        </div>
        <div className="carbs">
          <dt>Sacharidy</dt>
          <dd>{fmt(food.carbs)} g</dd>
        </div>
        <div className="fat">
          <dt>Tuky</dt>
          <dd>{fmt(food.fat)} g</dd>
        </div>
      </dl>
    </Link>
  )
}

export function RecipeCard({ recipe }) {
  const { totals } = recipeTotals(recipe)
  return (
    <Link to={`/recepty/${recipe.id}`} className="recipe-card">
      <div className="recipe-card-img">
        <span>{recipe.emoji}</span>
      </div>
      <strong className="recipe-card-name">{recipe.name}</strong>
      <div className="recipe-card-meta">
        <span>
          <Icon name="schedule" /> {recipe.time} min
        </span>
        <span>
          <Icon name="local_fire_department" /> {fmt(totals.kcal / recipe.portions, 0)} kcal
        </span>
      </div>
    </Link>
  )
}

export function Carousel({ children, label }) {
  const ref = useRef(null)
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <div className="carousel">
      <button className="carousel-btn" onClick={() => scroll(-1)} aria-label={`${label} – posunúť doľava`}>
        <Icon name="keyboard_arrow_left" />
      </button>
      <div className="carousel-track" ref={ref}>
        {children}
      </div>
      <button className="carousel-btn" onClick={() => scroll(1)} aria-label={`${label} – posunúť doprava`}>
        <Icon name="keyboard_arrow_right" />
      </button>
    </div>
  )
}
