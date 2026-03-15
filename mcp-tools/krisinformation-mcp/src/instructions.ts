/**
 * LLM instructions for the Krisinformation MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Krisinformation MCP — Instruktioner

Du har tillgång till 2 verktyg för att hämta krisinformation från Krisinformation.se (MSB).

## Verktyg

- **krisinformation_search** — Sök krisnyheter och händelser (senaste 7 dagarna som standard)
- **krisinformation_active** — Hämta aktiva VMA-varningar (Viktigt Meddelande till Allmänheten)

## Arbetsflöde

1. **Aktiva kriser** — Börja med krisinformation_active för att se om det finns pågående VMA
2. **Nyheter** — Använd krisinformation_search för bredare nyhetsöversikt
3. **Filtrera på län** — Ange county-kod för att begränsa till ett specifikt län

## Länskoder (urval)

| Kod | Län |
|-----|-----|
| 01 | Stockholms län |
| 12 | Skåne län |
| 14 | Västra Götalands län |

## Tips

- VMA-data uppdateras var 2:a minut i cachen
- Nyhetsdata uppdateras var 5:e minut
- Ingen API-nyckel krävs — öppet API
- Ange källa: "Källa: Krisinformation.se (MSB)"
`;
