import PRODUCTS_URL from './products.json?url'

// Databáza produktov je samostatný súbor (pri tisícoch produktov by spomaľovala hlavný balík
// a každá aktualizácia dát by zneplatnila cache aplikácie). Načíta sa pred spustením appky.
const PRODUCTS_RAW = await fetch(PRODUCTS_URL).then((r) => {
  if (!r.ok) throw new Error(`Nepodarilo sa načítať databázu potravín (HTTP ${r.status})`)
  return r.json()
})

// Nutričné hodnoty na 100 g (orientačné priemerné hodnoty).
// [id, názov, kategória, emoji, kcal, bielkoviny, sacharidy, cukry, tuky, nasýtené MK, vláknina, soľ, jednotky]
// jednotky: [[názov, gramy], ...]

export const CATEGORIES = [
  { id: 'ovocie', name: 'Ovocie', emoji: '🍎' },
  { id: 'zelenina', name: 'Zelenina', emoji: '🥦' },
  { id: 'mliecne', name: 'Mliečne výrobky a vajcia', emoji: '🥛' },
  { id: 'maso', name: 'Mäso a ryby', emoji: '🍗' },
  { id: 'pecivo', name: 'Pečivo a obilniny', emoji: '🍞' },
  { id: 'prilohy', name: 'Prílohy a strukoviny', emoji: '🍚' },
  { id: 'orechy', name: 'Orechy a semienka', emoji: '🥜' },
  { id: 'napoje', name: 'Nápoje', emoji: '🥤' },
  { id: 'sladkosti', name: 'Sladkosti a snacky', emoji: '🍫' },
  { id: 'tuky', name: 'Tuky a omáčky', emoji: '🫒' },
  { id: 'jedla', name: 'Hotové jedlá', emoji: '🍲' },
  { id: 'doplnky', name: 'Doplnky výživy', emoji: '💪' },
  { id: 'ostatne', name: 'Ostatné', emoji: '🛒' },
]

const RAW = [
  // Ovocie
  ['banan', 'Banán', 'ovocie', '🍌', 94, 1.2, 22, 19, 0.2, 0.1, 2, 0, [['ks', 120]]],
  ['jablko', 'Jablko', 'ovocie', '🍎', 52, 0.3, 12, 10, 0.2, 0, 2.4, 0, [['ks', 180]]],
  ['hruska', 'Hruška', 'ovocie', '🍐', 57, 0.4, 13, 10, 0.1, 0, 3.1, 0, [['ks', 170]]],
  ['pomaranc', 'Pomaranč', 'ovocie', '🍊', 47, 0.9, 10, 9, 0.1, 0, 2.4, 0, [['ks', 150]]],
  ['jahody', 'Jahody', 'ovocie', '🍓', 32, 0.7, 6, 4.9, 0.3, 0, 2, 0, [['hrnček', 150]]],
  ['cucoriedky', 'Čučoriedky', 'ovocie', '🫐', 57, 0.7, 12, 10, 0.3, 0, 2.4, 0, [['hrsť', 50]]],
  ['hrozno', 'Hrozno', 'ovocie', '🍇', 69, 0.7, 16, 16, 0.2, 0.1, 0.9, 0, [['strapec', 200]]],
  ['kiwi', 'Kiwi', 'ovocie', '🥝', 61, 1.1, 12, 9, 0.5, 0, 3, 0, [['ks', 75]]],
  ['avokado', 'Avokádo', 'ovocie', '🥑', 160, 2, 2, 0.7, 15, 2.1, 6.7, 0, [['ks', 150]]],
  ['ananas', 'Ananás', 'ovocie', '🍍', 50, 0.5, 12, 10, 0.1, 0, 1.4, 0, [['plátok', 80]]],
  ['mango', 'Mango', 'ovocie', '🥭', 60, 0.8, 15, 14, 0.4, 0.1, 1.6, 0, [['ks', 300]]],
  ['melon', 'Melón vodový', 'ovocie', '🍉', 30, 0.6, 7.6, 6.2, 0.2, 0, 0.4, 0, [['plátok', 280]]],
  // Zelenina
  ['rajcina', 'Rajčina', 'zelenina', '🍅', 18, 0.9, 3.5, 2.6, 0.2, 0, 1.2, 0, [['ks', 120]]],
  ['uhorka', 'Uhorka šalátová', 'zelenina', '🥒', 15, 0.7, 3, 1.7, 0.1, 0, 0.5, 0, [['ks', 300]]],
  ['paprika', 'Paprika červená', 'zelenina', '🫑', 31, 1, 6, 4.2, 0.3, 0, 2.1, 0, [['ks', 150]]],
  ['mrkva', 'Mrkva', 'zelenina', '🥕', 41, 0.9, 9.6, 4.7, 0.2, 0, 2.8, 0.2, [['ks', 70]]],
  ['brokolica', 'Brokolica', 'zelenina', '🥦', 34, 2.8, 6.6, 1.7, 0.4, 0, 2.6, 0.1, [['ružica', 15]]],
  ['spenat', 'Špenát', 'zelenina', '🥬', 23, 2.9, 3.6, 0.4, 0.4, 0.1, 2.2, 0.2, [['hrsť', 30]]],
  ['zemiaky', 'Zemiaky varené', 'zelenina', '🥔', 77, 2, 17, 0.8, 0.1, 0, 2.2, 0, [['ks', 100]]],
  ['cibula', 'Cibuľa', 'zelenina', '🧅', 40, 1.1, 9.3, 4.2, 0.1, 0, 1.7, 0, [['ks', 100]]],
  ['cuketa', 'Cuketa', 'zelenina', '🥒', 17, 1.2, 3.1, 2.5, 0.3, 0.1, 1, 0, [['ks', 200]]],
  ['salat', 'Šalát ľadový', 'zelenina', '🥬', 14, 0.9, 3, 2, 0.1, 0, 1.2, 0, [['list', 10]]],
  ['kukurica', 'Kukurica sladká', 'zelenina', '🌽', 86, 3.3, 19, 6.3, 1.4, 0.2, 2.7, 0, [['klas', 150]]],
  // Mliečne
  ['vajce', 'Vajce slepačie', 'mliecne', '🥚', 151, 12.4, 0.9, 0.4, 10.9, 3.2, 0, 0.3, [['ks', 55]]],
  ['mlieko15', 'Mlieko polotučné 1,5 %', 'mliecne', '🥛', 46, 3.4, 4.8, 4.8, 1.5, 1, 0, 0.1, [['pohár', 250]]],
  ['jogurt-biely', 'Jogurt biely 3 %', 'mliecne', '🥣', 64, 4.5, 5.5, 5.5, 3, 2, 0, 0.1, [['kelímok', 150]]],
  ['grecky-jogurt', 'Grécky jogurt 0 %', 'mliecne', '🥣', 58, 10, 3.6, 3.6, 0.3, 0.2, 0, 0.1, [['kelímok', 140]]],
  ['tvaroh', 'Tvaroh polotučný', 'mliecne', '🧀', 118, 17, 3.6, 3.6, 4, 2.5, 0, 0.1, [['balenie', 250]]],
  ['cottage', 'Cottage cheese', 'mliecne', '🧀', 98, 11, 3.4, 2.7, 4.3, 2.7, 0, 0.9, [['balenie', 150]]],
  ['eidam', 'Eidam 30 %', 'mliecne', '🧀', 264, 30, 0, 0, 16, 10, 0, 1.8, [['plátok', 20]]],
  ['mozzarella', 'Mozzarella', 'mliecne', '🧀', 250, 18, 2.2, 1, 19, 12, 0, 0.5, [['guľka', 125]]],
  ['maslo', 'Maslo', 'tuky', '🧈', 740, 0.6, 0.6, 0.6, 82, 54, 0, 0, [['lyžička', 5]]],
  ['skyr', 'Skyr natur', 'mliecne', '🥣', 63, 11, 4, 4, 0.2, 0.1, 0, 0.1, [['kelímok', 140]]],
  // Mäso a ryby
  ['kuracie-prsia', 'Kuracie prsia', 'maso', '🍗', 110, 23, 0, 0, 1.5, 0.4, 0, 0.2, [['kus', 150]]],
  ['morcacie-prsia', 'Morčacie prsia', 'maso', '🍗', 104, 24, 0, 0, 1, 0.3, 0, 0.2, [['kus', 150]]],
  ['bravcova-panenka', 'Bravčová panenka', 'maso', '🥩', 143, 21, 0, 0, 6, 2, 0, 0.1, [['kus', 150]]],
  ['hovadzie-mlete', 'Hovädzie mleté 10 %', 'maso', '🥩', 176, 20, 0, 0, 10, 4.2, 0, 0.2, [['porcia', 125]]],
  ['losos', 'Losos', 'maso', '🐟', 208, 20, 0, 0, 13, 3.1, 0, 0.1, [['filet', 125]]],
  ['tuniak', 'Tuniak vo vlastnej šťave', 'maso', '🐟', 116, 26, 0, 0, 1, 0.3, 0, 0.9, [['konzerva', 130]]],
  ['sunka', 'Šunka výberová', 'maso', '🥓', 105, 19, 1, 0.8, 3, 1, 0, 2.2, [['plátok', 15]]],
  ['krevety', 'Krevety', 'maso', '🦐', 99, 24, 0.2, 0, 0.3, 0.1, 0, 0.6, [['porcia', 100]]],
  // Pečivo a obilniny
  ['chlieb-kvaskovy', 'Chlieb kváskový', 'pecivo', '🍞', 245, 8.5, 48, 2, 1.5, 0.3, 4, 1.2, [['krajec', 40]]],
  ['chlieb-celozrnny', 'Chlieb celozrnný', 'pecivo', '🍞', 230, 9.5, 41, 3, 2.5, 0.5, 7, 1.1, [['krajec', 40]]],
  ['rozok', 'Rožok biely', 'pecivo', '🥖', 280, 9, 56, 3, 2.5, 0.6, 2.5, 1.3, [['ks', 43]]],
  ['ovsene-vlocky', 'Ovsené vločky', 'pecivo', '🥣', 372, 13, 59, 1, 7, 1.3, 10, 0, [['lyžica', 10], ['hrnček', 80]]],
  ['tortilla', 'Tortilla pšeničná', 'pecivo', '🌯', 310, 8.5, 52, 3, 7, 3, 2.5, 1.2, [['ks', 60]]],
  ['muesli', 'Müsli bez cukru', 'pecivo', '🥣', 360, 10, 60, 12, 6, 1, 8, 0.1, [['porcia', 50]]],
  ['ryzove-chlebicky', 'Ryžové chlebíčky', 'pecivo', '🍘', 387, 8, 81, 0.9, 2.8, 0.6, 4, 0.1, [['ks', 8]]],
  // Prílohy
  ['ryza', 'Ryža varená', 'prilohy', '🍚', 130, 2.7, 28, 0.1, 0.3, 0.1, 0.4, 0, [['porcia', 150]]],
  ['cestoviny', 'Cestoviny varené', 'prilohy', '🍝', 158, 5.8, 31, 0.6, 0.9, 0.2, 1.8, 0, [['porcia', 200]]],
  ['kuskus', 'Kuskus varený', 'prilohy', '🍚', 112, 3.8, 23, 0.1, 0.2, 0, 1.4, 0, [['porcia', 150]]],
  ['quinoa', 'Quinoa varená', 'prilohy', '🍚', 120, 4.4, 21, 0.9, 1.9, 0.2, 2.8, 0, [['porcia', 150]]],
  ['sosovica', 'Šošovica varená', 'prilohy', '🫘', 116, 9, 20, 1.8, 0.4, 0.1, 7.9, 0, [['porcia', 150]]],
  ['cicer', 'Cícer varený', 'prilohy', '🫘', 164, 8.9, 27, 4.8, 2.6, 0.3, 7.6, 0, [['porcia', 150]]],
  ['fazula', 'Fazuľa červená varená', 'prilohy', '🫘', 127, 8.7, 22, 0.3, 0.5, 0.1, 6.4, 0, [['porcia', 150]]],
  ['hranolky', 'Hranolky', 'prilohy', '🍟', 312, 3.4, 41, 0.3, 15, 2.3, 3.8, 0.6, [['porcia', 150]]],
  // Orechy
  ['mandle', 'Mandle', 'orechy', '🌰', 579, 21, 22, 4.4, 50, 3.8, 12.5, 0, [['hrsť', 30]]],
  ['vlasske-orechy', 'Vlašské orechy', 'orechy', '🌰', 654, 15, 14, 2.6, 65, 6.1, 6.7, 0, [['hrsť', 30]]],
  ['arasidove-maslo', 'Arašidové maslo', 'orechy', '🥜', 588, 25, 20, 9, 50, 10, 6, 0.4, [['lyžica', 15]]],
  ['chia', 'Chia semienka', 'orechy', '🌱', 486, 17, 42, 0, 31, 3.3, 34, 0, [['lyžica', 12]]],
  ['slnecnica', 'Slnečnicové semienka', 'orechy', '🌻', 584, 21, 20, 2.6, 51, 4.5, 8.6, 0, [['lyžica', 10]]],
  // Nápoje
  ['voda', 'Voda pitná', 'napoje', '💧', 0, 0, 0, 0, 0, 0, 0, 0, [['pohár', 250]]],
  ['kava-mlieko', 'Káva s mliekom bez cukru', 'napoje', '☕', 12, 0.5, 1, 1, 0.7, 0.4, 0, 0, [['šálka', 200]]],
  ['espresso', 'Espresso', 'napoje', '☕', 2, 0.1, 0, 0, 0.2, 0, 0, 0, [['šálka', 30]]],
  ['caj', 'Čaj nesladený', 'napoje', '🍵', 1, 0, 0.2, 0, 0, 0, 0, 0, [['šálka', 250]]],
  ['dzus-pomaranc', 'Pomarančový džús 100 %', 'napoje', '🧃', 45, 0.7, 10, 8.4, 0.2, 0, 0.2, 0, [['pohár', 250]]],
  ['cola', 'Cola', 'napoje', '🥤', 42, 0, 10.6, 10.6, 0, 0, 0, 0, [['plechovka', 330]]],
  ['pivo', 'Pivo svetlé 10°', 'napoje', '🍺', 36, 0.3, 3, 0, 0, 0, 0, 0, [['pollitrák', 500]]],
  ['vino-biele', 'Víno biele suché', 'napoje', '🍷', 82, 0.1, 2.6, 1, 0, 0, 0, 0, [['pohár', 200]]],
  // Sladkosti
  ['cokolada-horka', 'Čokoláda horká 70 %', 'sladkosti', '🍫', 580, 7.8, 36, 28, 42, 25, 11, 0, [['kocka', 5], ['tabuľka', 100]]],
  ['cokolada-mliecna', 'Čokoláda mliečna', 'sladkosti', '🍫', 535, 7.6, 59, 52, 30, 18, 3.4, 0.2, [['kocka', 5], ['tabuľka', 100]]],
  ['med', 'Med', 'sladkosti', '🍯', 304, 0.3, 82, 82, 0, 0, 0.2, 0, [['lyžička', 8]]],
  ['cukor', 'Cukor biely', 'sladkosti', '🧂', 400, 0, 100, 100, 0, 0, 0, 0, [['lyžička', 5]]],
  ['chipsy', 'Zemiakové lupienky', 'sladkosti', '🥔', 536, 7, 53, 0.5, 34, 3.1, 4.4, 1.3, [['balíček', 70]]],
  ['susienky', 'Sušienky maslové', 'sladkosti', '🍪', 480, 6.5, 69, 25, 20, 11, 2, 0.8, [['ks', 8]]],
  ['zmrzlina', 'Zmrzlina vanilková', 'sladkosti', '🍨', 207, 3.5, 24, 21, 11, 6.8, 0.7, 0.2, [['kopček', 60]]],
  ['proteinova-tycinka', 'Proteínová tyčinka', 'sladkosti', '🍫', 360, 30, 35, 5, 12, 6, 6, 0.5, [['ks', 60]]],
  // Tuky a omáčky
  ['olivovy-olej', 'Olivový olej', 'tuky', '🫒', 884, 0, 0, 0, 100, 14, 0, 0, [['lyžica', 10]]],
  ['repkovy-olej', 'Repkový olej', 'tuky', '🫗', 884, 0, 0, 0, 100, 7, 0, 0, [['lyžica', 10]]],
  ['majoneza', 'Majonéza', 'tuky', '🥚', 680, 1, 1.5, 1.3, 75, 6, 0, 1.4, [['lyžica', 15]]],
  ['kecup', 'Kečup', 'tuky', '🍅', 101, 1.2, 24, 22, 0.1, 0, 0.3, 2.3, [['lyžica', 15]]],
  ['horcica', 'Horčica plnotučná', 'tuky', '🟡', 100, 5.5, 6, 4, 5, 0.3, 3, 4.5, [['lyžička', 5]]],
  // Hotové jedlá
  ['pizza-margherita', 'Pizza Margherita', 'jedla', '🍕', 250, 11, 31, 3.5, 9, 4.5, 2, 1.2, [['kúsok', 110], ['celá', 450]]],
  ['halusky', 'Bryndzové halušky', 'jedla', '🍲', 205, 6.5, 26, 1, 8.5, 4.5, 1.5, 1.1, [['porcia', 350]]],
  ['rezen', 'Vyprážaný bravčový rezeň', 'jedla', '🍖', 270, 18, 13, 0.5, 16, 3.5, 0.6, 0.9, [['kus', 150]]],
  ['gulas', 'Hovädzí guláš', 'jedla', '🍲', 125, 11, 6, 2, 6.5, 2.4, 1, 1, [['porcia', 300]]],
  ['kapustnica', 'Kapustnica', 'jedla', '🥣', 60, 3.5, 4, 2, 3.5, 1.3, 1.5, 1, [['tanier', 350]]],
  ['hamburger', 'Hamburger', 'jedla', '🍔', 254, 13, 26, 5, 11, 4, 1.4, 1.2, [['ks', 220]]],
  ['palacinky', 'Palacinky s džemom', 'jedla', '🥞', 230, 6, 37, 15, 6.5, 2, 1, 0.3, [['ks', 80]]],
]

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const GENERIC = RAW.map(([id, name, category, emoji, kcal, protein, carbs, sugar, fat, satFat, fiber, salt, units]) => ({
  id,
  name,
  category,
  emoji,
  generic: true,
  kcal,
  protein,
  carbs,
  sugar,
  fat,
  satFat,
  fiber,
  salt,
  units: [['g', 1], ...units],
}))

// Reálne produkty predávané na Slovensku – Open Food Facts (ODbL), pozri scripts/build-products.mjs.
export const IMAGE_BASE = 'https://images.openfoodfacts.org/images/products/'
const catEmoji = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.emoji]))

const PRODUCTS = PRODUCTS_RAW.map((p) => ({
  ...p,
  emoji: catEmoji[p.category] || '🛒',
  img: p.img ? IMAGE_BASE + p.img : null,
  units: [['g', 1], ...(p.units || [])],
}))

export const FOODS = [...GENERIC, ...PRODUCTS]

// Obchody zoradené podľa počtu produktov.
export const STORES = Object.entries(
  PRODUCTS.flatMap((p) => p.stores || []).reduce((m, s) => ((m[s] = (m[s] || 0) + 1), m), {}),
)
  .sort((a, b) => b[1] - a[1])
  .map(([name, count]) => ({ name, count }))

// Populárne: produkty so slovenským/českým názvom a fotkou, striedavo z rôznych kategórií.
const candidates = PRODUCTS.filter((p) => p.img && p.stores && p.category !== 'doplnky' && /[čďľĺňŕšťžěřů]/i.test(p.name))
const byCategory = {}
for (const p of candidates) (byCategory[p.category] ||= []).push(p)
const popular = []
for (let round = 0; popular.length < 14 && round < 5; round++) {
  for (const list of Object.values(byCategory)) if (list[round] && popular.length < 14) popular.push(list[round])
}
export const POPULAR_FOOD_IDS = popular.map((p) => p.id)

export { slug as toSlug }
