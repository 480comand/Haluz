# NutriDenník

Kalorické tabuľky v Reacte s **reálnymi produktmi zo slovenských obchodov** (Kaufland, Tesco, Lidl, Billa, COOP Jednota, Penny…). Je tam jedálniček, recepty, aktivity a plán na mieru. Rozloženie je inšpirované stránkou kaloricketabulky.sk, názov, logo, kód aj dáta sú vlastné.

## Spustenie

```bash
npm install
npm run dev
```

Potom otvor http://localhost:5173. Produkčný build vytvoríš príkazom `npm run build` (výstup je v `dist/`). Po pushnutí do vetvy `main` aplikáciu automaticky nasadí na GitHub Pages workflow `.github/workflows/deploy.yml`.

## Dáta o produktoch

Asi 1 900 produktov predávaných na Slovensku s nutričnými hodnotami z etikiet, fotkami a obchodmi, v ktorých sa predávajú. Zdrojom je otvorená databáza [Open Food Facts](https://world.openfoodfacts.org) (dáta pod licenciou ODbL, fotky pod CC BY-SA). Dopĺňa ich asi 90 základných potravín (ovocie, zelenina, mäso…).

Aktualizácia dát:

```bash
# 1. stiahni surový export (všetky stránky) zo search.openfoodfacts.org do off-raw.json
# 2. preveď ho na src/data/products.json
node scripts/build-products.mjs off-raw.json
```

## Funkcie

- **Domov:** vyhľadávanie, populárne potraviny a recepty, prehľad obchodov a kalkulačka plánu.
- **Tabuľka potravín:** karty jednotlivých obchodov, kategórie, triedenie, stránkovanie a vlastné potraviny.
- **Detail potraviny:** fotka, značka, obchody, prepočet podľa množstva a jednotky (g, porcia, balenie), odporúčaný denný príjem, zloženie, Nutri-Score a EAN.
- **Recepty:** filter podľa chodu a diéty, hodnoty vypočítané zo surovín, zmena počtu porcií.
- **Katalóg aktivít:** výdaj v kcal/kg/min a prepočet na tvoju hmotnosť.
- **Jedálniček:** 6 jedál denne, aktivity, pitný režim, hmotnosť a kopírovanie predchádzajúceho dňa.
- **Štatistiky:** príjem za 7, 14 alebo 30 dní, makroživiny, vývoj hmotnosti a BMI.
- **Môj plán:** výpočet podľa Mifflin-St Jeor, časová os k cieľu, záloha a obnova dát.

Tvoje záznamy sa ukladajú iba v `localStorage` prehliadača.
