// Prevedie surový export Open Food Facts (produkty predávané na Slovensku) na kompaktný JSON pre aplikáciu.
// Použitie: node scripts/build-products.mjs <off-raw.json>
// Surové dáta stiahne scripts/fetch-off.mjs.
import { readFileSync, writeFileSync } from 'node:fs'
import { SK_STORES, CZ_ONLY_STORES, STORE_BRANDS, brandTag } from './stores.mjs'

const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const OUT = new URL('../src/data/products.json', import.meta.url)

const first = (v) => (Array.isArray(v) ? v[0] : v)
const round = (n, d = 1) => (n == null || Number.isNaN(Number(n)) ? 0 : Math.round(Number(n) * 10 ** d) / 10 ** d)


const RULES = [
  ['doplnky', ['dietary-supplements', 'bodybuilding-supplements', 'protein-powders', 'whey']],
  ['napoje', ['beverages', 'waters', 'juices', 'sodas', 'teas', 'coffees', 'alcoholic', 'beers', 'wines', 'energy-drinks', 'carbonated-drinks', 'plant-milks', 'syrups']],
  ['mliecne', ['dairies', 'cheeses', 'yogurts', 'milks', 'eggs', 'creams', 'quarks', 'butters', 'dairy-substitutes', 'fermented-milk']],
  ['maso', ['meats', 'fishes', 'seafood', 'sausages', 'hams', 'poultries', 'meat-alternatives', 'meat-analogues', 'canned-fishes']],
  ['sladkosti', ['sweet-snacks', 'chocolates', 'biscuits', 'candies', 'confectioneries', 'desserts', 'cakes', 'salty-snacks', 'chips', 'crisps', 'ice-creams', 'wafers', 'puddings', 'bars', 'popcorn', 'sweeteners', 'honeys', 'jams']],
  ['orechy', ['nuts', 'seeds', 'peanuts', 'almonds', 'dried-fruits']],
  ['pecivo', ['breads', 'breakfast-cereals', 'cereals', 'flakes', 'mueslis', 'porridge', 'crackers', 'rice-cakes', 'viennoiseries', 'pastries', 'flours']],
  ['prilohy', ['pastas', 'rices', 'legumes', 'potatoes', 'noodles', 'couscous', 'grains']],
  ['tuky', ['fats', 'oils', 'sauces', 'condiments', 'spreads', 'mayonnaises', 'ketchup', 'mustards', 'dressings', 'margarines']],
  ['jedla', ['meals', 'soups', 'pizzas', 'prepared-salads', 'sandwiches', 'pasta-dishes', 'ready-meals', 'frozen-foods']],
  ['ovocie', ['fruits', 'fruit-based', 'compotes', 'fruit-purees']],
  ['zelenina', ['vegetables', 'vegetable-based', 'pickles', 'mushrooms']],
]

const UMBRELLA = new Set(['plant-based-foods-and-beverages', 'plant-based-foods', 'beverages-and-beverages-preparations', 'fermented-foods', 'snacks', 'frozen-foods', 'groceries'])

// Kľúčové slová v názve (sk/cz/en) pre produkty bez kategórie v Open Food Facts.
const NAME_RULES = [
  ['doplnky', /protein|whey|kreatin|creatine|bcaa|vitamin|kolagen|collagen/],
  ['napoje', /napoj|nápoj|drink|dzus|džús|juice|limonad|cola|voda|water|pivo|beer|vino|víno|wine|kava|káva|coffee|caj|čaj|\btea\b|smoothie|sirup|tonic|mlieko ovsen|oat milk|almond milk|energy/],
  ['mliecne', /jogurt|yogurt|joghurt|syr|sýr|cheese|tvaroh|tvaroh|cottage|mozzarell|eidam|edam|gouda|mlieko|mléko|milk|smotan|smetan|kefir|skyr|maslo|máslo|butter|bryndz|niva|parenica|ostiepok|vajc|vejce|eggs?\b/],
  ['maso', /šunk|sunk|ham\b|salám|salam|klobás|klobas|párk|park|kurac|kuřec|chicken|morč|turkey|bravč|pork|hovädz|beef|slanin|bacon|tuniak|tuňák|tuna|losos|salmon|ryb|fish|sardin|sproty|šproty|makrel|pastéta|pastet|jackfruit|tofu|tempeh/],
  ['sladkosti', /čokol|cokol|chocolat|schoko|sušienk|susienk|keks|biscuit|cookie|oblátk|oplatk|wafer|tyčink|tycink|\bbar\b|cukrík|bonbon|candy|gumm|chips|lupienk|brambůrk|crisps|popcorn|zmrzlin|ice cream|dezert|dessert|puding|pudding|koláč|torta|dort|cake|croissant|donut|med\b|honey|džem|dzem|jam\b|nutella|lentilk|bounty|snickers|twix|mars\b|kinder|milka|horalk|tatranky|kofol/],
  ['orechy', /orech|ořech|nut|mandl|almond|arašid|arasid|peanut|kešu|cashew|semien|semín|seed|chia|ľan|lněn|slnečnic|sunflower|tekvic|pumpkin|hrozienk|rozink|raisin|datl|date|brusnic|brusin|cranberr/],
  ['pecivo', /chlieb|chléb|bread|rožok|rohlík|bageta|pečivo|toast|vločk|vločk|flakes|oats|ovsen|ovesn|müsli|musli|muesli|granola|cornflakes|cereal|kaša|kaše|porridge|krekr|cracker|chlebíč|knäck|tortill|wrap|múka|mouka|flour/],
  ['prilohy', /cestovin|těstovin|pasta|špaget|spaghetti|fusilli|penne|ryža|rýže|rice|šošovic|čočk|lentil|fazuľ|fazol|bean|cícer|cizrn|chickpea|zemiak|brambor|potato|kuskus|couscous|quinoa|bulgur|rezance|nudle|noodle|gnocchi|halušk/],
  ['tuky', /olej|oil|kečup|kecup|ketchup|horčic|hořčic|mustard|majonéz|majonez|mayo|omáčk|omack|sauce|dresing|dressing|pesto|margarín|nátierk|natierk|pomazánk|hummus|ocot|ocet|vinegar/],
  ['jedla', /polievk|polévk|soup|pizza|lasagn|rizoto|risotto|šalát|salát|salad|sendvič|sandwich|burger|guláš|gulas|knedl|pirohy|halušky|hotové jedlo|meal/],
  ['ovocie', /jablk|jablek|apple|banán|banan|jahod|strawberr|malin|raspberr|čučoried|borůvk|blueberr|ovocie|ovoce|fruit|mango|ananás|pineapple|hrušk|pear|broskyň|peach|marhuľ|apricot|višn|cherr|kompót|kompot|pyré/],
  ['zelenina', /zelenin|vegetable|paradajk|rajčin|rajčat|tomato|uhork|okurk|cucumber|paprik|mrkv|carrot|brokolic|špenát|spinach|kapust|cabbage|cibuľ|onion|cesnak|garlic|kukuric|corn|hrášok|hrách|peas|šampiň|hrib|houb|mushroom|olív|oliv|kyslá|sterilizovan/],
]

function category(tags = [], name = '') {
  const slugs = tags
    .map((t) => t.split(':')[1] || t)
    .filter((s) => !UMBRELLA.has(s))
    .reverse()
  for (const slug of slugs) {
    for (const [cat, keys] of RULES) {
      if (keys.some((k) => slug === k || slug.endsWith(`-${k}`) || slug.startsWith(`${k}-`) || slug.includes(`-${k}-`))) return cat
    }
  }
  const n = name.toLowerCase()
  for (const [cat, re] of NAME_RULES) if (re.test(n)) return cat
  return 'ostatne'
}

function imagePath(code) {
  if (code.length <= 8) return code
  const c = code.padStart(13, '0')
  return `${c.slice(0, 3)}/${c.slice(3, 6)}/${c.slice(6, 9)}/${c.slice(9)}`
}

function frontImage(p) {
  const imgs = p.images || {}
  const keys = Object.keys(imgs).filter((k) => k.startsWith('front'))
  const pref = ['front_sk', 'front_cs', 'front_en', 'front']
  const key = pref.find((k) => keys.includes(k)) || keys[0]
  if (!key) return null
  const rev = imgs[key].rev
  if (!rev) return null
  return `${imagePath(p.code)}/${key}.${rev}.400.jpg`
}

function cleanName(s) {
  s = String(s).replace(/\s+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function grams(qty) {
  if (!qty) return null
  const m = String(qty).replace(',', '.').match(/([\d.]+)\s*(kg|g|ml|l|cl)\b/i)
  if (!m) return null
  const v = Number(m[1])
  const u = m[2].toLowerCase()
  const g = u === 'kg' || u === 'l' ? v * 1000 : u === 'cl' ? v * 10 : v
  return g > 0 && g <= 5000 ? Math.round(g) : null
}

function storesOf(p) {
  const list = (v) => (Array.isArray(v) ? v : v ? String(v).split(',') : [])
  const fromField = list(p.stores).map((s) => SK_STORES[s.trim().toLowerCase()])
  const brandTags = p.brands_tags?.length ? p.brands_tags : list(p.brands).map(brandTag)
  const fromBrand = brandTags.map((t) => STORE_BRANDS[String(t).replace(/^[a-z]{2}:/, '')])
  return [...new Set([...fromField, ...fromBrand].filter(Boolean))]
}

const seen = new Set()
const out = []
for (const p of raw) {
  const n = p.nutriments || {}
  let kcal = n['energy-kcal_100g']
  if (kcal == null && n['energy-kj_100g'] != null) kcal = n['energy-kj_100g'] / 4.184
  const nameRaw = ['product_name_sk', 'product_name_cs', 'product_name', 'product_name_en'].map((k) => first(p[k])).find(Boolean)
  if (!nameRaw || kcal == null || kcal > 950) continue
  if (/[Ѐ-ӿͰ-Ͽ؀-ۿ一-鿿]/.test(nameRaw)) continue
  const name = cleanName(nameRaw)
  if (name.length < 3) continue
  const brand = cleanName(first(p.brands) || '')
  const key = `${name.toLowerCase()}|${brand.toLowerCase()}`
  if (seen.has(key)) continue
  seen.add(key)

  const stores = storesOf(p)
  const inSlovakia = (p.countries_tags || []).includes('en:slovakia')
  if (!inSlovakia) {
    // České produkty berieme len vtedy, keď sa predávajú v reťazci, ktorý je aj na Slovensku.
    for (let i = stores.length - 1; i >= 0; i--) if (CZ_ONLY_STORES.has(stores[i])) stores.splice(i, 1)
    if (!stores.length) continue
  }
  const units = []
  const sq = Number(p.serving_quantity)
  if (sq > 0 && sq < 2000) units.push(['porcia', Math.round(sq)])
  const pack = grams(p.quantity)
  if (pack && pack !== Math.round(sq)) units.push(['balenie', pack])

  out.push({
    id: `p${p.code}`,
    code: p.code,
    name,
    brand: brand || undefined,
    stores: stores.length ? stores : undefined,
    qty: p.quantity ? String(p.quantity).trim() : undefined,
    category: category(p.categories_tags, name),
    img: frontImage(p) || undefined,
    ns: p.nutriscore_grade && /^[a-e]$/.test(p.nutriscore_grade) ? p.nutriscore_grade : undefined,
    scans: p.unique_scans_n || 0,
    kcal: round(kcal, 0),
    protein: round(n.proteins_100g),
    carbs: round(n.carbohydrates_100g),
    sugar: round(n.sugars_100g),
    fat: round(n.fat_100g),
    satFat: round(n['saturated-fat_100g']),
    fiber: round(n.fiber_100g),
    salt: round(n.salt_100g, 2),
    units: units.length ? units : undefined,
  })
}

out.sort((a, b) => b.scans - a.scans || a.name.localeCompare(b.name, 'sk'))
writeFileSync(OUT, JSON.stringify(out))
const byCat = out.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {})
console.log('products', out.length, 'with img', out.filter((p) => p.img).length, 'with store', out.filter((p) => p.stores).length)
console.log(byCat)
const byStore = out.flatMap((p) => p.stores || []).reduce((m, s) => ((m[s] = (m[s] || 0) + 1), m), {})
console.log(Object.entries(byStore).sort((a, b) => b[1] - a[1]))
