import { useEffect, useRef } from 'react'
import { fmt, MACRO_COLORS } from '../lib/nutrition.js'

export function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo">
      <rect width="64" height="64" rx="12" fill="var(--brand)" />
      <circle cx="32" cy="35" r="16" fill="none" stroke="#fff" strokeWidth="4.5" />
      <path d="M32 7c7 0 11 4.5 11 10-7 0-11-3.5-11-10z" fill="var(--brand-leaf)" />
      <path d="M25 35l5 5 10-10" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Ikona z písma Material Symbols. */
export function Icon({ name, fill = false, className = '' }) {
  return (
    <span className={`ms ${fill ? 'fill' : ''} ${className}`} aria-hidden="true">
      {name}
    </span>
  )
}

/** Fotka produktu, alebo emoji pre všeobecné potraviny. */
export function FoodImage({ food, className = '' }) {
  if (food.img) return <img src={food.img} alt={food.name} loading="lazy" className={`food-img ${className}`} />
  return (
    <span className={`food-img emoji ${className}`} role="img" aria-label={food.name}>
      {food.emoji}
    </span>
  )
}

export function StoreBadges({ stores, max = 3 }) {
  if (!stores?.length) return null
  return (
    <span className="stores">
      {stores.slice(0, max).map((s) => (
        <span key={s} className={`store store-${s.toLowerCase().replace(/[^a-z]/g, '')}`}>
          {s}
        </span>
      ))}
    </span>
  )
}

export function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector('input, select, button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Zavrieť">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

/** Prstencový graf zloženia makroživín (podiel energie). */
export function MacroDonut({ protein, carbs, fat, size = 140, label }) {
  const kp = protein * 4
  const kc = carbs * 4
  const kf = fat * 9
  const total = kp + kc + kf
  const r = 52
  const c = 2 * Math.PI * r
  const parts = total
    ? [
        ['protein', kp / total],
        ['carbs', kc / total],
        ['fat', kf / total],
      ]
    : []
  let offset = 0
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label="Pomer makroživín">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--track)" strokeWidth="16" />
      {parts.map(([k, p]) => {
        const len = p * c
        const el = (
          <circle
            key={k}
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={MACRO_COLORS[k]}
            strokeWidth="16"
            strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 70 70)"
          />
        )
        offset += len
        return el
      })}
      {label && (
        <text x="70" y="76" textAnchor="middle" className="donut-label">
          {label}
        </text>
      )}
    </svg>
  )
}

export function MacroLegend({ protein, carbs, fat }) {
  const total = protein * 4 + carbs * 4 + fat * 9 || 1
  const rows = [
    ['protein', 'Bielkoviny', protein * 4],
    ['carbs', 'Sacharidy', carbs * 4],
    ['fat', 'Tuky', fat * 9],
  ]
  return (
    <ul className="legend">
      {rows.map(([k, name, v]) => (
        <li key={k}>
          <span className="dot" style={{ background: MACRO_COLORS[k] }} />
          {name} <strong>{fmt((v / total) * 100, 0)} %</strong>
        </li>
      ))}
    </ul>
  )
}

/** Kruhový ukazovateľ zostávajúcej energie. */
export function EnergyRing({ eaten, burned, goal }) {
  const net = eaten - burned
  const pct = goal ? Math.min(net / goal, 1.5) : 0
  const r = 78
  const c = 2 * Math.PI * r
  const over = net > goal
  const remaining = goal - net
  return (
    <div className="energy-ring">
      <svg viewBox="0 0 200 200" width="200" height="200" role="img" aria-label={`Prijaté ${Math.round(eaten)} kcal z ${goal}`}>
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--track)" strokeWidth="18" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={over ? 'var(--danger)' : 'var(--brand)'}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0, Math.min(pct, 1)) * c} ${c}`}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dasharray .5s ease' }}
        />
      </svg>
      <div className="energy-ring-text">
        <span className="big">{fmt(Math.abs(remaining), 0)}</span>
        <span className="muted">{over ? 'kcal nad cieľ' : 'kcal zostáva'}</span>
      </div>
    </div>
  )
}

export function ProgressBar({ value, max, color = 'var(--brand)', label, unit = 'g' }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  const over = max && value > max * 1.05
  return (
    <div className="pbar">
      <div className="pbar-top">
        <span>{label}</span>
        <span className={over ? 'over' : ''}>
          <strong>{fmt(value, value < 10 ? 1 : 0)}</strong> / {fmt(max, 0)} {unit}
        </span>
      </div>
      <div className="pbar-track">
        <div className="pbar-fill" style={{ width: `${pct}%`, background: over ? 'var(--danger)' : color }} />
      </div>
    </div>
  )
}

export function BarChart({ data, goal, height = 180, unit = 'kcal' }) {
  const max = Math.max(goal || 0, ...data.map((d) => d.value), 1) * 1.1
  const w = 100 / data.length
  return (
    <div className="chart">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" width="100%" height={height} role="img" aria-label="Graf príjmu energie">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 4)
          const over = goal && d.value > goal
          return (
            <rect
              key={d.label + i}
              x={i * w + w * 0.18}
              y={height - h}
              width={w * 0.64}
              height={h}
              rx="1.2"
              fill={over ? 'var(--warn)' : 'var(--brand)'}
              opacity={d.value ? 1 : 0.25}
            >
              <title>{`${d.title || d.label}: ${fmt(d.value, 0)} ${unit}`}</title>
            </rect>
          )
        })}
        {goal ? (
          <line
            x1="0"
            x2="100"
            y1={height - (goal / max) * (height - 4)}
            y2={height - (goal / max) * (height - 4)}
            stroke="var(--text-muted)"
            strokeDasharray="1.5 1.5"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
      <div className="chart-labels">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

export function LineChart({ points, target, height = 200 }) {
  if (points.length === 0) return null
  const vals = points.map((p) => p.value).concat(target ? [target] : [])
  const min = Math.min(...vals) - 1
  const max = Math.max(...vals) + 1
  const W = 600
  const H = height
  const pad = 28
  const x = (i) => (points.length === 1 ? W / 2 : pad + (i / (points.length - 1)) * (W - pad * 2))
  const y = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Vývoj hmotnosti" className="line-chart">
      {[0, 0.5, 1].map((t) => {
        const v = min + (max - min) * t
        return (
          <g key={t}>
            <line x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="var(--border)" />
            <text x={4} y={y(v) + 4} className="axis">
              {fmt(v, 1)}
            </text>
          </g>
        )
      })}
      {target ? (
        <>
          <line x1={pad} x2={W - pad} y1={y(target)} y2={y(target)} stroke="var(--brand)" strokeDasharray="6 5" />
          <text x={W - pad} y={y(target) - 6} textAnchor="end" className="axis brand">
            cieľ {fmt(target, 1)} kg
          </text>
        </>
      ) : null}
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r="4.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5">
          <title>{`${p.label}: ${fmt(p.value, 1)} kg`}</title>
        </circle>
      ))}
    </svg>
  )
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null
  const nums = []
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i)
  if (nums[nums.length - 1] < pages) nums.push(pages)
  return (
    <nav className="pagination" aria-label="Stránkovanie">
      <button className="icon-btn" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Predchádzajúca">
        <Icon name="keyboard_arrow_left" />
      </button>
      {nums.map((n) => (
        <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => onChange(n)} aria-current={n === page}>
          {n}
        </button>
      ))}
      <button className="icon-btn" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Ďalšia">
        <Icon name="keyboard_arrow_right" />
      </button>
    </nav>
  )
}

export function Empty({ icon = '🍽️', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <strong>{title}</strong>
      {children && <p className="muted">{children}</p>}
    </div>
  )
}
