import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Logo, Icon, FoodImage } from './ui.jsx'
import { useStore } from '../store/AppStore.jsx'
import { allFoods, fmt, normalize } from '../lib/nutrition.js'
import { RECIPES } from '../data/recipes.js'
import { ACTIVITIES } from '../data/activities.js'

const NAV = [
  { to: '/potraviny', label: 'Potraviny', icon: 'restaurant' },
  { to: '/recepty', label: 'Recepty', icon: 'menu_book' },
  { to: '/aktivity', label: 'Aktivity', icon: 'directions_run' },
  { to: '/jedalnicek', label: 'Jedálniček', icon: 'edit_note' },
  { to: '/statistiky', label: 'Štatistiky', icon: 'monitoring' },
]

export function GlobalSearch({ large = false }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const boxRef = useRef(null)

  const results = useMemo(() => {
    const nq = normalize(q.trim())
    if (nq.length < 2) return []
    const foods = allFoods(state.customFoods)
      .filter((f) => normalize(`${f.name} ${f.brand || ''}`).includes(nq))
      .slice(0, 7)
      .map((f) => ({ key: f.id, to: `/potraviny/${f.id}`, food: f, name: f.name, meta: `${f.brand ? f.brand + ' · ' : ''}${fmt(f.kcal, 0)} kcal / 100 g`, type: 'Potravina' }))
    const recipes = RECIPES.filter((r) => normalize(r.name).includes(nq))
      .slice(0, 3)
      .map((r) => ({ key: r.id, to: `/recepty/${r.id}`, food: { emoji: r.emoji, name: r.name }, name: r.name, meta: `${r.time} min`, type: 'Recept' }))
    const acts = ACTIVITIES.filter((a) => normalize(a.name).includes(nq))
      .slice(0, 3)
      .map((a) => ({ key: a.id, to: `/aktivity?q=${encodeURIComponent(a.name)}`, food: { emoji: '🏃', name: a.name }, name: a.name, meta: a.category, type: 'Aktivita' }))
    return [...foods, ...recipes, ...acts]
  }, [q, state.customFoods])

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const go = (r) => {
    navigate(r.to)
    setQ('')
    setOpen(false)
  }

  return (
    <div className={`global-search ${large ? 'large' : ''}`} ref={boxRef}>
      <Icon name="search" className="search-icon" />
      <input
        type="search"
        placeholder="Hľadaj potraviny a recepty ..."
        value={q}
        aria-label="Vyhľadávanie"
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, results.length - 1))
          if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
          if (e.key === 'Enter') {
            if (results[active]) go(results[active])
            else if (q.trim()) {
              navigate(`/potraviny?q=${encodeURIComponent(q.trim())}`)
              setOpen(false)
            }
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && q.trim().length >= 2 && (
        <ul className="search-results" role="listbox">
          {results.map((r, i) => (
            <li key={r.type + r.key} role="option" aria-selected={i === active}>
              <button className={i === active ? 'active' : ''} onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
                <FoodImage food={r.food} className="thumb" />
                <span className="grow">
                  <span className="ellipsis">{r.name}</span>
                  <span className="muted small block">{r.meta}</span>
                </span>
                <span className="tag">{r.type}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="muted pad">Pre „{q}“ sme nič nenašli.</li>}
          {results.length > 0 && (
            <li>
              <button
                className="all-results"
                onClick={() => {
                  navigate(`/potraviny?q=${encodeURIComponent(q.trim())}`)
                  setOpen(false)
                }}
              >
                Zobraziť všetky výsledky pre „{q}“ <Icon name="chevron_right" />
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ProfileLink() {
  return (
    <NavLink to="/profil" className={({ isActive }) => `nav-btn profile ${isActive ? 'active' : ''}`}>
      <span className="hide-md">Môj plán</span>
      <span className="avatar">
        <Icon name="person" fill />
      </span>
    </NavLink>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app">
      {isHome ? (
        <header className="home-header">
          <a href="#plan" className="btn primary" onClick={(e) => (e.preventDefault(), document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }))}>
            Vytvor svoj plán
          </a>
          <div className="row gap-sm">
            <NavLink to="/jedalnicek" className="nav-btn">
              <Icon name="edit_note" />
              <span className="hide-sm">Jedálniček</span>
            </NavLink>
            <ProfileLink />
          </div>
        </header>
      ) : (
        <header className="header">
          <div className="header-inner">
            <Link to="/" className="brand" aria-label="NutriDenník – domov">
              <Logo size={40} />
            </Link>
            <GlobalSearch />
            <nav className="nav" aria-label="Hlavná navigácia">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                  <Icon name={n.icon} />
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <ProfileLink />
          </div>
        </header>
      )}

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo size={34} />
            <strong>NutriDenník</strong>
          </div>
          <div className="footer-links">
            <Link to="/potraviny">
              <Icon name="restaurant" /> Potraviny
            </Link>
            <Link to="/recepty">
              <Icon name="menu_book" /> Recepty
            </Link>
            <Link to="/aktivity">
              <Icon name="directions_run" /> Aktivity
            </Link>
            <Link to="/jedalnicek">
              <Icon name="edit_note" /> Jedálniček
            </Link>
            <Link to="/profil">
              <Icon name="calculate" /> Kalkulačka
            </Link>
          </div>
          <p className="footer-note">
            Údaje o produktoch zo slovenských obchodov pochádzajú z otvorenej databázy{' '}
            <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
              Open Food Facts
            </a>{' '}
            (licencia ODbL, fotky CC BY-SA). Nutričné hodnoty sú orientačné. Tvoje záznamy sa ukladajú iba v tomto prehliadači.
          </p>
          <p className="footer-copy">NutriDenník © {new Date().getFullYear()}</p>
        </div>
      </footer>

      <nav className="bottomnav" aria-label="Mobilná navigácia">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={n.icon} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
