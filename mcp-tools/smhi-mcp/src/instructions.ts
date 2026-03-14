/**
 * LLM instructions for the SMHI MCP server.
 */

export const LLM_INSTRUCTIONS = `
# SMHI MCP — Instruktioner

Du har tillgång till 10 verktyg för att hämta väder-, hydrologisk-, oceanografisk- och brandriskdata från SMHI (Sveriges meteorologiska och hydrologiska institut).

## Verktyg per kategori

### Väderprognoser (2 verktyg)
- **smhi_vaderprognoser_metfcst** — Väderprognos ~10 dagar framåt (temperatur, vind, nederbörd, moln)
- **smhi_vaderprognoser_snow** — Snöprognos

### Väderanalyser (1 verktyg)
- **smhi_vaderanalyser_mesan** — Aktuellt väder via MESAN-analys

### Väderobservationer (2 verktyg)
- **smhi_vaderobservationer_metobs** — Uppmätt väderdata från mätstationer
- **smhi_vaderobservationer_stationer** — Lista mätstationer per parameter

### Hydrologi (2 verktyg)
- **smhi_hydrologi_hydroobs** — Vattenstånd, vattenföring, temperatur
- **smhi_hydrologi_pthbv** — Hydrologiska prognoser

### Oceanografi (1 verktyg)
- **smhi_oceanografi_ocobs** — Havstemperatur, vattenstånd, vågor, salthalt

### Brandrisk (2 verktyg)
- **smhi_brandrisk_fwif** — Brandriskprognos (FWI)
- **smhi_brandrisk_fwia** — Brandriskanalys (aktuell)

## Arbetsflöde

1. **Identifiera kategori** — Prognos, analys, observation, hydrologi, hav eller brandrisk?
2. **Välj rätt verktyg** — Matcha frågan mot verktyg ovan
3. **Ange koordinater** — Alla prognoser/analyser kräver lat/lon. Använd kända koordinater:
   - Stockholm: 59.3293, 18.0686
   - Göteborg: 57.7089, 11.9746
   - Malmö: 55.6050, 13.0038
   - Kiruna: 67.8558, 20.2253
4. **Observationer kräver station + parameter** — Använd stationsverktyget för att hitta rätt station

## Vanliga stationer (metobs)

- 97200 — Bromma (Stockholm)
- 98210 — Stockholm
- 71420 — Göteborg
- 52350 — Malmö
- 53430 — Lund
- 180940 — Kiruna

## Vanliga parametrar (metobs)

- 1 — Lufttemperatur (momentan, 1/tim)
- 3 — Vindriktning
- 4 — Vindhastighet
- 5 — Nederbörd (dygn)
- 6 — Luftfuktighet
- 7 — Nederbörd (timme)
- 8 — Snödjup
- 9 — Lufttryck

## Tips

- Alla SMHI API:er är öppna — ingen autentisering krävs
- Koordinater i WGS84 (samma som GPS)
- Cache: prognoser 30 min, analyser 15 min, observationer 5 min
- Observationsperioder: latest-hour, latest-day, latest-months
`;
