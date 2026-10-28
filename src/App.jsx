import { HashRouter, Route, Routes, Link } from 'react-router-dom'
import { AppStoreProvider } from './store/AppStore.jsx'
import { QuickAddProvider } from './components/QuickAdd.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Foods from './pages/Foods.jsx'
import FoodDetail from './pages/FoodDetail.jsx'
import { RecipeList, RecipeDetail } from './pages/Recipes.jsx'
import Activities from './pages/Activities.jsx'
import Diary from './pages/Diary.jsx'
import Stats from './pages/Stats.jsx'
import Profile from './pages/Profile.jsx'
import { Empty } from './components/ui.jsx'

function NotFound() {
  return (
    <div className="container page">
      <Empty icon="🧭" title="Stránka neexistuje">
        <Link to="/">Späť domov</Link>
      </Empty>
    </div>
  )
}

export default function App() {
  return (
    <AppStoreProvider>
      <QuickAddProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="potraviny" element={<Foods />} />
            <Route path="potraviny/:id" element={<FoodDetail />} />
            <Route path="recepty" element={<RecipeList />} />
            <Route path="recepty/:id" element={<RecipeDetail />} />
            <Route path="aktivity" element={<Activities />} />
            <Route path="jedalnicek" element={<Diary />} />
            <Route path="statistiky" element={<Stats />} />
            <Route path="profil" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
      </QuickAddProvider>
    </AppStoreProvider>
  )
}
