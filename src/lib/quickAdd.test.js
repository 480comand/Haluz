import { describe, expect, it } from 'vitest'
import { amountText, defaultAmount, defaultMeal, findEntry, lastAmount, stepDown, stepUp } from './quickAdd.js'

const rozok = { id: 'rozok', name: 'Rožok biely', units: [['g', 1], ['ks', 43]] }
const ryza = { id: 'ryza', name: 'Ryža', units: [['g', 1]] }

describe('defaultMeal', () => {
  it('vyberie jedlo podľa hodiny', () => {
    expect(defaultMeal(7)).toBe('ranajky')
    expect(defaultMeal(10)).toBe('desiata')
    expect(defaultMeal(12)).toBe('obed')
    expect(defaultMeal(15)).toBe('olovrant')
    expect(defaultMeal(19)).toBe('vecera')
    expect(defaultMeal(22)).toBe('druha-vecera')
  })
})

describe('defaultAmount', () => {
  it('bez histórie vezme prvú porciu', () => {
    expect(defaultAmount(rozok, {})).toEqual({ qty: 1, unit: 'ks', grams: 43 })
  })

  it('potravina bez porcie má 100 g', () => {
    expect(defaultAmount(ryza, {})).toEqual({ qty: 100, unit: 'g', grams: 100 })
  })

  it('zapamätá si naposledy zjedené množstvo', () => {
    const diary = {
      '2026-10-27': { foods: [{ id: 'a', foodId: 'rozok', qty: 1, unit: 'ks', grams: 43, meal: 'ranajky' }] },
      '2026-10-28': {
        foods: [
          { id: 'b', foodId: 'rozok', qty: 2, unit: 'ks', grams: 86, meal: 'ranajky' },
          { id: 'c', foodId: 'ryza', qty: 180, unit: 'g', grams: 180, meal: 'obed' },
        ],
      },
    }
    expect(defaultAmount(rozok, diary)).toEqual({ qty: 2, unit: 'ks', grams: 86 })
    expect(defaultAmount(ryza, diary)).toEqual({ qty: 180, unit: 'g', grams: 180 })
  })

  it('ignoruje zapamätanú jednotku, ktorú potravina už nemá', () => {
    const diary = { '2026-10-28': { foods: [{ id: 'b', foodId: 'rozok', qty: 1, unit: 'balenie', grams: 400, meal: 'obed' }] } }
    expect(defaultAmount(rozok, diary)).toEqual({ qty: 1, unit: 'ks', grams: 43 })
  })
})

describe('lastAmount', () => {
  it('bez histórie vráti null', () => {
    expect(lastAmount(rozok, {})).toBeNull()
  })

  it('vráti posledné množstvo z histórie', () => {
    const diary = { '2026-10-28': { foods: [{ id: 'b', foodId: 'rozok', qty: 3, unit: 'ks', grams: 129, meal: 'obed' }] } }
    expect(lastAmount(rozok, diary)).toEqual({ qty: 3, unit: 'ks', grams: 129 })
  })
})

describe('amountText', () => {
  it('pri porcii ukáže aj gramy', () => {
    expect(amountText(rozok, 2, 'ks')).toBe('2 ks (86 g)')
  })

  it('pri gramoch ukáže iba gramy', () => {
    expect(amountText(ryza, 150, 'g')).toBe('150 g')
  })

  it('polovicu porcie zapíše s desatinnou čiarkou', () => {
    expect(amountText(rozok, 0.5, 'ks')).toBe('0,5 ks (22 g)')
  })
})

describe('findEntry', () => {
  it('nájde posledný záznam potraviny v danom jedle', () => {
    const day = {
      foods: [
        { id: 'a', foodId: 'rozok', meal: 'ranajky' },
        { id: 'b', foodId: 'rozok', meal: 'obed' },
        { id: 'c', foodId: 'rozok', meal: 'obed' },
      ],
    }
    expect(findEntry(day, 'rozok', 'obed').id).toBe('c')
    expect(findEntry(day, 'rozok', 'vecera')).toBeNull()
    expect(findEntry(undefined, 'rozok', 'obed')).toBeNull()
  })
})

describe('stepUp / stepDown', () => {
  it('pri porciách pridá a uberie jeden kus', () => {
    const e = { qty: 1, unit: 'ks', grams: 43 }
    expect(stepUp(e, rozok)).toEqual({ qty: 2, grams: 86 })
    expect(stepDown({ qty: 2, unit: 'ks', grams: 86 }, rozok)).toEqual({ qty: 1, grams: 43 })
  })

  it('pri gramoch pridáva po množstve z prvého zápisu', () => {
    const e = { qty: 150, unit: 'g', grams: 150, step: 150 }
    expect(stepUp(e, ryza)).toEqual({ qty: 300, grams: 300 })
  })

  it('pri gramoch bez uloženého kroku pridáva po 50 g', () => {
    expect(stepUp({ qty: 120, unit: 'g', grams: 120 }, ryza)).toEqual({ qty: 170, grams: 170 })
  })

  it('pod nulu vráti null, čiže záznam zmazať', () => {
    expect(stepDown({ qty: 1, unit: 'ks', grams: 43 }, rozok)).toBeNull()
    expect(stepDown({ qty: 0.5, unit: 'ks', grams: 22 }, rozok)).toBeNull()
  })
})
