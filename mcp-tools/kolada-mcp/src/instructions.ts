/**
 * LLM instructions for the Kolada MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Kolada MCP — Instruktioner

Du har tillgång till 10 verktyg för att hämta svensk kommunstatistik från Kolada (RKA).

## Verktyg per kategori

### Sök (3 verktyg)
- **kolada_sok_nyckeltal** — Sök nyckeltal (KPI:er) efter namn/nyckelord
- **kolada_sok_kommun** — Sök kommuner efter namn
- **kolada_sok_enhet** — Sök organisatoriska enheter (skolor, vårdcentraler, etc.)

### Hämta data (4 verktyg)
- **kolada_data_kommun** — KPI-värden för en specifik kommun
- **kolada_data_alla_kommuner** — KPI-värden för alla kommuner ett visst år
- **kolada_data_enhet** — KPI-värden per organisatorisk enhet
- **kolada_nyckeltal_detalj** — Detaljerad metadata om ett nyckeltal

### Jämförelse (2 verktyg)
- **kolada_jamfor_kommuner** — Jämför kommuner på ett nyckeltal
- **kolada_trend** — Trenddata över flera år

### Referens (1 verktyg)
- **kolada_kommungrupper** — Lista kommungrupper (klassificeringar)

## Arbetsflöde

1. **Sök nyckeltal** — Använd kolada_sok_nyckeltal för att hitta rätt KPI-ID
2. **Sök kommun** — Använd kolada_sok_kommun för att hitta rätt kommun-ID
3. **Hämta data** — Använd rätt dataverktyg med KPI-ID och kommun-ID
4. **Tolka resultat** — Presentera data i tabellform

## Vanliga nyckeltal-ID:n

- N00945 — Invånare totalt
- N01951 — Nettokostnadsavvikelse, kr/inv
- U09400 — Elever i åk 9 som uppnått kunskapskraven i alla ämnen
- N07900 — Resultat av medborgarundersökning
- N00941 — Befolkningsökning/-minskning

## Vanliga kommun-ID:n

- 0180 — Stockholm
- 1280 — Malmö
- 1480 — Göteborg
- 0380 — Uppsala
- 0580 — Linköping

## Tips

- Kommun-ID:n är alltid 4 siffror (t.ex. "0180" för Stockholm)
- Kön: T=Totalt, M=Män, K=Kvinnor — standard är T
- Cache: 30 min data, 24 timmar metadata
- API:t kräver ingen nyckel (öppet API)
- Sök alltid först efter rätt ID innan du hämtar data
`;
