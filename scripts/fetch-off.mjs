// Stiahne produkty z Open Food Facts (search.openfoodfacts.org) do surového JSON pre build-products.mjs.
// Použitie: node scripts/fetch-off.mjs off-raw.json
// Berie produkty predávané na Slovensku a české produkty reťazcov, ktoré sú aj na Slovensku.
import { writeFileSync } from 'node:fs'
import { STORE_BRANDS } from './stores.mjs'

const OUT = process.argv[2] || 'off-raw.json'
const API = 'https://search.openfoodfacts.org/search'
const PAGE_SIZE = 100
const MAX_WINDOW = 10000 // Elasticsearch nevráti viac ako 10 000 výsledkov na jeden dopyt
const FIELDS = [
  'code', 'product_name', 'product_name_sk', 'product_name_cs', 'product_name_en', 'brands', 'brands_tags',
  'stores', 'stores_tags', 'countries_tags', 'quantity', 'serving_quantity', 'categories_tags', 'nutriments',
  'images', 'nutriscore_grade', 'unique_scans_n',
].join(',')

const CHAIN_STORE_TAGS = ['lidl', 'kaufland', 'tesco', 'billa', 'penny', 'penny-market', 'globus', 'coop', 'albert']
const or = (field, values) => `${field}:(${values.map((v) => `"${v}"`).join(' OR ')})`

const SK = 'countries_tags:"en:slovakia"'
const CZ = 'countries_tags:"en:czech-republic"'
// Rozdelenie podľa Nutri-Score, aby žiadny dopyt neprekročil limit 10 000 výsledkov.
const GRADES = ['a', 'b', 'c', 'd', 'e']
const gradeShards = (base) => [
  ...GRADES.map((g) => `${base} AND nutriscore_grade:"${g}"`),
  `${base} AND NOT nutriscore_grade:(${GRADES.map((g) => `"${g}"`).join(' OR ')})`,
]

const QUERIES = [
  ...gradeShards(SK),
  ...gradeShards(`${CZ} AND NOT ${SK} AND (${or('stores_tags', CHAIN_STORE_TAGS)} OR ${or('brands_tags', Object.keys(STORE_BRANDS))})`),
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getPage(q, page) {
  const url = `${API}?${new URLSearchParams({ q, page: String(page), page_size: String(PAGE_SIZE), fields: FIELDS })}`
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'NutriDennik/1.0 (github.com/480comand/Haluz)' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
      return await res.json()
    } catch (e) {
      if (attempt >= 5) throw e
      console.warn(`  pokus ${attempt} zlyhal (${e.message}), skúšam znova`)
      await sleep(2000 * attempt)
    }
  }
}

const products = new Map()
for (const q of QUERIES) {
  const first = await getPage(q, 1)
  const count = first.count ?? 0
  const pages = Math.min(first.page_count ?? Math.ceil(count / PAGE_SIZE), MAX_WINDOW / PAGE_SIZE)
  console.log(`${count} výsledkov (${pages} strán): ${q.slice(0, 160)}`)
  if (count > MAX_WINDOW) console.warn(`  POZOR: viac ako ${MAX_WINDOW} výsledkov, časť sa nestiahne`)
  let hits = first.hits || []
  for (let page = 1; ; ) {
    for (const p of hits) if (p.code && !products.has(p.code)) products.set(p.code, p)
    if (++page > pages) break
    await sleep(300)
    hits = (await getPage(q, page)).hits || []
    if (!hits.length) break
  }
  console.log(`  spolu unikátnych: ${products.size}`)
}

writeFileSync(OUT, JSON.stringify([...products.values()]))
console.log(`Uložené ${products.size} produktov do ${OUT}`)
