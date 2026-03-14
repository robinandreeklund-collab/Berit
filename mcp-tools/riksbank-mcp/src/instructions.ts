/**
 * LLM instructions for the Riksbank MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Riksbank MCP — Instruktioner

Du har tillgång till 8 verktyg för att hämta ekonomisk data från Sveriges Riksbank.

## Verktyg per kategori

### Räntor (2 verktyg)
- **riksbank_ranta_styrranta** — Styrränta (reporänta) och historik
- **riksbank_ranta_marknadsrantor** — STIBOR, statsobligationer, bostadsräntor

### Valuta (2 verktyg)
- **riksbank_valuta_kurser** — Valutakurser mot SEK (EUR, USD, etc.)
- **riksbank_valuta_korskurser** — Korskurs mellan två valutor

### SWESTR (1 verktyg)
- **riksbank_swestr** — Svensk dagslåneränta (referensränta)

### Prognoser (3 verktyg)
- **riksbank_prognos_inflation** — KPI, KPIF-prognoser
- **riksbank_prognos_bnp** — BNP-prognoser
- **riksbank_prognos_ovrigt** — Övriga makroprognoser, lista indikatorer

## Arbetsflöde

1. **Identifiera kategori** — Räntor, valuta, SWESTR eller prognoser?
2. **Välj rätt verktyg** — Matcha frågan mot verktyg ovan
3. **Ange filter** — Datum, valuta eller indikator
4. **Tolka resultat** — Presentera data i tabellform

## Viktiga serie-ID:n

- SECBREPOEFF — Styrränta (reporänta)
- SECBDEPOEFF — Inlåningsränta
- SEKEURPMI — EUR/SEK
- SEKUSDPMI — USD/SEK

## Gruppkoder

- 2 — Riksbankens styrräntor
- 3 — STIBOR
- 130 — Valutor mot SEK
- 131 — Korskurser

## Tips

- Datumformat: YYYY-MM-DD
- Valutakoder: EUR, USD, GBP, NOK, DKK, CHF, JPY
- Cache: 1 timme räntor, 24 timmar metadata
- API:t fungerar utan nyckel (5 req/min) eller med nyckel (200 req/min)
`;
