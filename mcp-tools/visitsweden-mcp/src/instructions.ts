/**
 * LLM instructions for the Visit Sweden MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Visit Sweden MCP — Instruktioner

Du har tillgång till 4 verktyg för att hämta turistinformation från Visit Sweden (data.visitsweden.com).

## Verktyg

- **visitsweden_search** — Sök efter platser, boenden, restauranger eller evenemang
- **visitsweden_get_details** — Hämta fullständig info om en specifik post (ID krävs)
- **visitsweden_search_events** — Sök evenemang med datumfilter
- **visitsweden_nearby** — Hitta attraktioner/boenden nära en plats

## Arbetsflöde

1. **Sök först** — Använd visitsweden_search eller visitsweden_search_events
2. **Detaljer vid behov** — Använd visitsweden_get_details med entry-ID från sökningen
3. **Nära en plats** — Använd visitsweden_nearby för att hitta saker i närheten

## Typer

| Typ | Beskrivning |
|-----|-------------|
| Event | Evenemang, festivaler, konserter |
| LodgingBusiness | Hotell, vandrarhem, camping, stuga |
| Place | Platser, sevärdheter, attraktioner |
| FoodEstablishment | Restauranger, caféer, barer |

## Tips

- Data från Visit Swedens öppna länkade dataplattform
- Ingen autentisering krävs
- Sökresultat returnerar ID:n — använd dessa för att hämta detaljer
- Cache: 30 min sökresultat, 1 timme detaljer
`;
