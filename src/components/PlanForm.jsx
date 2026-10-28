import { useState } from 'react'
import { ACTIVITY_LEVELS, GOALS, computePlan, fmt, fmtDate, bmi, bmiLabel } from '../lib/nutrition.js'
import { useStore, useToast } from '../store/AppStore.jsx'

function SliderField({ label, value, min, max, step = 1, unit, onChange, extra }) {
  return (
    <div className="slider-field">
      <div className="slider-top">
        <span>{label}</span>
        <span className="slider-value">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={label}
          />
          {unit && <span className="muted">{unit}</span>}
          {extra}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={`${label} posuvník`} />
    </div>
  )
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'active' : ''} onClick={() => onChange(o.id)}>
          {o.name}
        </button>
      ))}
    </div>
  )
}

/** Profil a výpočet denného plánu – živý náhľad pri každej zmene. */
export default function PlanForm({ compact = false }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [p, setP] = useState(state.profile)
  const set = (patch) => setP((prev) => ({ ...prev, ...patch }))
  const plan = computePlan(p)
  const currentYear = new Date().getFullYear()
  const b = bmi(p.weight, p.height)

  const save = () => {
    dispatch({ type: 'profile/set', patch: { ...p, saved: true } })
    toast('Plán uložený')
  }

  return (
    <div className={`plan ${compact ? 'compact' : ''}`}>
      <div className="plan-form card">
        <h2>Vytvor si svoj plán</h2>
        <Segmented
          label="Pohlavie"
          options={[
            { id: 'zena', name: 'Žena' },
            { id: 'muz', name: 'Muž' },
          ]}
          value={p.sex}
          onChange={(sex) => set({ sex })}
        />
        <div className="field-label">Chcem</div>
        <Segmented label="Cieľ" options={GOALS} value={p.goal} onChange={(goal) => set({ goal })} />
        <SliderField label="Rok narodenia" value={p.birthYear} min={currentYear - 90} max={currentYear - 14} onChange={(birthYear) => set({ birthYear })} />
        <SliderField label="Výška" value={p.height} min={130} max={220} unit="cm" onChange={(height) => set({ height })} />
        <SliderField label="Hmotnosť" value={p.weight} min={35} max={200} step={0.5} unit="kg" onChange={(weight) => set({ weight })} />
        {p.goal !== 'fit' && (
          <SliderField label="Cieľová hmotnosť" value={p.targetWeight} min={35} max={200} step={0.5} unit="kg" onChange={(targetWeight) => set({ targetWeight })} />
        )}
        {p.goal !== 'fit' && (
          <>
            <div className="field-label">Tempo</div>
            <Segmented
              label="Tempo"
              options={[
                { id: 0.25, name: '0,25 kg/týž.' },
                { id: 0.5, name: '0,5 kg/týž.' },
                { id: 0.75, name: '0,75 kg/týž.' },
              ]}
              value={p.rate}
              onChange={(rate) => set({ rate })}
            />
          </>
        )}
        <label className="field">
          <span>Bežná aktivita</span>
          <select value={p.activity} onChange={(e) => set({ activity: e.target.value })}>
            {ACTIVITY_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} – {l.desc}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary block" onClick={save}>
          Uložiť profil a vytvoriť plán
        </button>
      </div>

      <div className="plan-result card highlight">
        <div className="plan-headline">
          {plan.direction === 'chudnut' && (
            <>
              Budeš chudnúť <strong>{fmt(plan.rate, 2)} kg</strong> týždenne
            </>
          )}
          {plan.direction === 'pribrat' && (
            <>
              Budeš priberať <strong>{fmt(plan.rate, 2)} kg</strong> týždenne
            </>
          )}
          {plan.direction === 'udrziavat' && <>Udržíš si hmotnosť a kondíciu</>}
        </div>
        {plan.direction !== 'udrziavat' && (
          <div className="timeline">
            <div>
              <span className="muted small">Dnes</span>
              <strong>{fmt(p.weight, 1)} kg</strong>
            </div>
            {plan.milestoneDate && plan.weeks > 4 && (
              <div>
                <span className="muted small">Míľnik {fmtDate(plan.milestoneDate)}</span>
                <strong>{fmt(plan.milestoneKg, 1)} kg</strong>
              </div>
            )}
            <div>
              <span className="muted small">Cieľ {fmtDate(plan.targetDate, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <strong>{fmt(plan.target, 1)} kg</strong>
            </div>
          </div>
        )}
        <div className="muted small">Odporúčaný denný príjem</div>
        <div className="plan-grid">
          <div className="plan-tile energy">
            <span>Energia</span>
            <strong>{fmt(plan.kcal, 0)} kcal</strong>
          </div>
          <div className="plan-tile protein">
            <span>Bielkoviny</span>
            <strong>{plan.protein} g</strong>
          </div>
          <div className="plan-tile fat">
            <span>Tuky</span>
            <strong>{plan.fat} g</strong>
          </div>
          <div className="plan-tile carbs">
            <span>Sacharidy</span>
            <strong>{plan.carbs} g</strong>
          </div>
          <div className="plan-tile fiber">
            <span>Vláknina</span>
            <strong>{fmt(plan.fiber, 1)} g</strong>
          </div>
          <div className="plan-tile water">
            <span>Voda</span>
            <strong>{fmt(plan.water / 1000, 2)} l</strong>
          </div>
        </div>
        {!compact && (
          <div className="plan-meta muted small">
            BMI {fmt(b, 1)} ({bmiLabel(b)}) · bazálny metabolizmus {fmt(plan.bmr, 0)} kcal · celkový výdaj {fmt(plan.tdee, 0)} kcal
          </div>
        )}
      </div>
    </div>
  )
}
