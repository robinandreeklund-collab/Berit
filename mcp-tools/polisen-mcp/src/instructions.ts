/**
 * LLM instructions for the Polisen MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Polisen MCP — Instruktioner

Du har tillgång till 1 verktyg för att hämta polishändelser från Polisen.se.

## Verktyg

- **polisen_events** — Hämta aktuella polishändelser med filtrering på plats och typ

## Arbetsflöde

1. **Hämta händelser** — Använd polisen_events med valfritt länsfilter
2. **Filtrera vid behov** — Ange typ (t.ex. "Trafikolycka", "Brand") eller plats (län)
3. **Presentera** — Visa i tabell med datum, typ, plats och sammanfattning

## Vanliga händelsetyper

Misshandel, Stöld, Inbrott, Trafikolycka, Brand, Rån, Skottlossning,
Narkotikabrott, Bedrägeri, Olaga hot, Rattfylleri, Mord/dråp, Djur

## Tips

- Data uppdateras var 5–10 minut
- Ingen API-nyckel krävs — öppet API
- Filtrering sker klient-sidan (API:t returnerar alla händelser)
- GPS-koordinater ingår i varje händelse
- Cache: 3 minuter
- Ange källa: "Källa: Polisen.se"
`;
