import { Link } from 'react-router-dom'
import { Logo, Icon } from '../components/ui.jsx'
import { GlobalSearch } from '../components/Layout.jsx'
import { FoodCard, RecipeCard, Carousel } from '../components/Cards.jsx'
import PlanForm from '../components/PlanForm.jsx'
import { FOODS, POPULAR_FOOD_IDS, STORES } from '../data/foods.js'
import { RECIPES } from '../data/recipes.js'
import { useStore } from '../store/AppStore.jsx'
import { toKey } from '../lib/date.js'
import { dayTotals, fmt } from '../lib/nutrition.js'

function TodayTeaser() {
  const { state, plan } = useStore()
  if (!state.profile.saved) return null
  const eaten = dayTotals(state.diary[toKey()], state.customFoods).totals.kcal
  return (
    <Link to="/jedalnicek" className="today-teaser">
      <Icon name="edit_note" /> Dnes máš zapísaných{' '}
      <strong>
        {fmt(eaten, 0)} / {fmt(plan.kcal, 0)} kcal
      </strong>
      <Icon name="chevron_right" />
    </Link>
  )
}

export default function Home() {
  const popular = POPULAR_FOOD_IDS.map((id) => FOODS.find((f) => f.id === id))
  const productCount = FOODS.filter((f) => !f.generic).length
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-brand">
          <Logo size={72} />
          <h1>NutriDenník</h1>
        </div>
        <GlobalSearch large />
        <div className="hero-links">
          <Link className="nav-btn" to="/potraviny">
            <Icon name="restaurant" /> Potraviny
          </Link>
          <Link className="nav-btn" to="/recepty">
            <Icon name="menu_book" /> Recepty
          </Link>
          <Link className="nav-btn" to="/aktivity">
            <Icon name="directions_run" /> Aktivity
          </Link>
        </div>
        <TodayTeaser />
      </section>

      <section className="home-section">
        <div className="section-head">
          <h2>Populárne potraviny</h2>
          <Link to="/potraviny" className="more">
            Všetky potraviny
          </Link>
        </div>
        <Carousel label="Populárne potraviny">
          {popular.map((f) => (
            <FoodCard key={f.id} food={f} />
          ))}
        </Carousel>
      </section>

      <section className="home-section">
        <div className="section-head">
          <h2>Populárne recepty</h2>
          <Link to="/recepty" className="more">
            Všetky recepty
          </Link>
        </div>
        <Carousel label="Populárne recepty">
          {RECIPES.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </Carousel>
      </section>

      <section className="home-section shops">
        <h2>Potraviny zo slovenských obchodov</h2>
        <p className="muted">
          {fmt(productCount, 0)} reálnych produktov s nutričnými hodnotami z etikiet. Vyber obchod a pozri sa, čo v ňom nájdeš.
        </p>
        <div className="shop-grid">
          {STORES.slice(0, 10).map((s) => (
            <Link key={s.name} to={`/potraviny?obchod=${encodeURIComponent(s.name)}`} className={`shop-tile store-${s.name.toLowerCase().replace(/[^a-z]/g, '')}`}>
              <strong>{s.name}</strong>
              <span>{s.count} produktov</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section features">
        <p className="features-lead">V aplikácii nájdeš prehľad, zápis, recepty a štatistiky. Sú navrhnuté tak, aby ti pomohli dosiahnuť tvoj cieľ.</p>
        <div className="feature-grid">
          <div className="feature">
            <div className="feature-img">
              <Icon name="donut_large" />
            </div>
            <p>Maj každý deň prehľad o príjme a výdaji kalórií.</p>
          </div>
          <div className="feature">
            <div className="feature-img water">
              <Icon name="water_drop" fill />
            </div>
            <p>Udržuj svoj pitný režim.</p>
          </div>
          <div className="feature">
            <div className="feature-img weight">
              <Icon name="monitor_weight" />
            </div>
            <p>Zaznamenávaj svoju hmotnosť.</p>
          </div>
        </div>
      </section>

      <section className="home-section" id="plan">
        <PlanForm />
      </section>
    </div>
  )
}
