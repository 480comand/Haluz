import { useRef } from 'react'
import { Link } from 'react-router-dom'
import PlanForm from '../components/PlanForm.jsx'
import { DemoButton } from './Stats.jsx'
import { FoodImage } from '../components/ui.jsx'
import { useStore, useToast } from '../store/AppStore.jsx'
import { fmt } from '../lib/nutrition.js'

export default function Profile() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const fileRef = useRef(null)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nutridennik-zaloha-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file) => {
    try {
      const data = JSON.parse(await file.text())
      if (!data || typeof data !== 'object' || !data.profile) throw new Error('bad')
      dispatch({ type: 'state/replace', state: data })
      toast('Dáta obnovené zo zálohy')
    } catch {
      alert('Súbor nie je platná záloha NutriDenníka.')
    }
  }

  return (
    <div className="panel">
      <div className="page-head">
        <h1>Môj plán</h1>
      </div>
      <PlanForm key={state.profile.weight} />

      <div className="profile-grid">
        <div className="card">
          <h3>Vlastné potraviny</h3>
          {state.customFoods.length ? (
            <ul className="similar">
              {state.customFoods.map((f) => (
                <li key={f.id}>
                  <Link to={`/potraviny/${f.id}`}>
                    <FoodImage food={f} className="thumb" />
                    <span className="grow">{f.name}</span>
                    <span className="muted small">{fmt(f.kcal, 0)} kcal</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Zatiaľ žiadne. Pridať ich môžeš v <Link to="/potraviny">tabuľke potravín</Link>.
            </p>
          )}
        </div>
        <div className="card">
          <h3>Dáta</h3>
          <p className="muted small">Všetko sa ukladá iba v tomto prehliadači. Zálohu si môžeš stiahnuť a neskôr obnoviť.</p>
          <div className="row gap wrap">
            <button className="btn" onClick={exportData}>
              ⬇ Stiahnuť zálohu
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              ⬆ Obnoviť zo zálohy
            </button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && importData(e.target.files[0])} />
            <DemoButton />
            <button
              className="btn danger"
              onClick={() => {
                if (confirm('Naozaj vymazať všetky záznamy, profil a vlastné potraviny?')) {
                  dispatch({ type: 'state/reset' })
                  toast('Všetko vymazané')
                }
              }}
            >
              Vymazať všetko
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
