// Obchody na Slovensku: názvy z poľa „stores“ v Open Food Facts a privátne značky reťazcov.

export const SK_STORES = {
  tesco: 'Tesco',
  kaufland: 'Kaufland',
  lidl: 'Lidl',
  billa: 'Billa',
  'coop jednota': 'COOP Jednota',
  coop: 'COOP Jednota',
  jednota: 'COOP Jednota',
  terno: 'Terno',
  penny: 'Penny',
  'penny market': 'Penny',
  fresh: 'Fresh',
  metro: 'Metro',
  makro: 'Metro',
  dm: 'dm',
  'dm drogerie markt': 'dm',
  kraj: 'Kraj',
  yeme: 'Yeme',
  labaš: 'Labaš',
  cba: 'CBA',
  globus: 'Globus',
  albert: 'Albert',
  auchan: 'Auchan',
  aldi: 'Aldi',
  spar: 'Spar',
  'rohlik.cz': 'Rohlík',
  rohlik: 'Rohlík',
  'potraviny.sk': 'Potraviny.sk',
  gymbeam: 'GymBeam',
}

// Reťazce, ktoré na Slovensku nie sú. Pri českých produktoch sa nezobrazujú.
export const CZ_ONLY_STORES = new Set(['Albert', 'Rohlík'])

// Privátne značky (tagy brands_tags v Open Food Facts) -> obchod, v ktorom sa predávajú.
const BRANDS = {
  Lidl: [
    'lidl', 'pilos', 'milbona', 'crownfield', 'freeway', 'solevita', 'fin-carre', 'chef-select', 'alesto', 'snack-day',
    'favorina', 'combino', 'vitasia', 'baresa', 'italiamo', 'pikok', 'dulano', 'belbake', 'bellarom', 'kania',
    'sondey', 'eridanous', 'mcennedy', 'trattoria-alfredo', 'nixe', 'ocean-sea', 'lord-nelson', 'gelatelli',
    'tastino', 'rivercote', 'harvest-basket', 'fairglobe', 'next-level-meat', 'vemondo', 'mister-choc',
    'j-d-gross', 'maribel', 'batts', 'cucina-nobile', 'perlenbacher', 'linessa', 'freshona', 'sol-mar',
    'duc-de-coeur', 'crusti-croc', 'bon-gelati', 'chef-select-bio', 'bio-organic',
  ],
  Kaufland: [
    'k-classic', 'k-bio', 'k-favourites', 'k-take-it-veggie', 'k-to-go', 'k-purland', 'k-free', 'k-classic-bio',
    'exquisit', 'k-wertschatze',
  ],
  Tesco: [
    'tesco', 'tesco-finest', 'tesco-value', 'tesco-organic', 'tesco-free-from', 'tesco-plant-chef', 'hearty-food-co',
    'stockwell-co', 'grower-s-harvest', 'eastman-s', 'h-w-nevill-s', 'ms-molly-s', 'wicked-kitchen', 'boswell-farms',
    'woodside-farms', 'creamfields', 'redmere-farms', 'nightingale-farms',
  ],
  Billa: ['billa', 'clever', 'billa-bio', 'billa-premium'],
  'COOP Jednota': ['coop', 'coop-jednota', 'jednota', 'coop-premium', 'coop-bio'],
  Penny: ['penny'],
  Globus: ['globus'],
  dm: ['dmbio', 'dm-bio'],
}

export const STORE_BRANDS = Object.fromEntries(Object.entries(BRANDS).flatMap(([store, tags]) => tags.map((t) => [t, store])))

export const brandTag = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
