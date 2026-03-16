---
name: blocket-tradera
description: Använd denna färdighet när användaren frågar om Blocket, Tradera,
  köpa begagnat, sälja saker, second hand, loppis, auktion, begagnade bilar,
  begagnade båtar, begagnade motorcyklar, prishistorik, prisjämförelse,
  marknadsplatser, annonser, klassificerade annonser, begagnatmarknaden,
  köp och sälj, hitta produkter, sökresultat Blocket, eller Tradera-auktioner.
mcp-server: blocket-tradera
---

# Blocket & Tradera (Blocket/Tradera MCP v1.0)

## Översikt
Sök och jämför priser på Sveriges två största marknadsplatser — Blocket och Tradera. 10 MCP-verktyg för sökning, prisjämförelse och detaljerad annonsinformation.

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `marketplace_search` | Samlad sökning på Blocket + Tradera |
| `blocket_search` | Sök annonser på Blocket (med län/region-filter) |
| `blocket_search_cars` | Sök bilar på Blocket (märke, modell, årsmodell) |
| `blocket_search_boats` | Sök båtar på Blocket (typ: segelbåt, motorbåt etc.) |
| `blocket_search_mc` | Sök motorcyklar på Blocket (typ: sport, cruiser etc.) |
| `tradera_search` | Sök auktioner på Tradera (rikstäckande) |
| `get_listing_details` | Hämta fullständig annonsinformation |
| `compare_prices` | Prisjämförelse mellan plattformar |
| `get_categories` | Lista tillgängliga kategorier |
| `get_regions` | Lista svenska regioner/län |

## Arbetsflöde

1. **Identifiera plattform** — Vill användaren söka Blocket, Tradera, eller båda?
   - Båda → `marketplace_search`
   - Bara Blocket → `blocket_search` (eller specialiserade: `blocket_search_cars`, `blocket_search_boats`, `blocket_search_mc`)
   - Bara Tradera → `tradera_search`
2. **Filtrera** — Lägg till regionfilter (Blocket), kategori, prisintervall
3. **Detaljer** — `get_listing_details` för fullständig information
4. **Jämför** — `compare_prices` för prisjämförelse

### Vanliga frågor
- "Hitta en begagnad cykel i Stockholm" → `blocket_search` med region
- "Sök iPhone på Blocket och Tradera" → `marketplace_search`
- "Begagnade Volvo V60 under 200000" → `blocket_search_cars`
- "Jämför priser på PS5" → `compare_prices`

## Fordonstyper

### Båtar (blocket_search_boats)
SEGELBAT, MOTORBAT, JOLLE, KATAMARAN, GUMMIBAT, KANOT_KAJAK, HUSBAT, FISKEBAT

### Motorcyklar (blocket_search_mc)
SPORT, CRUISER, TOURING, NAKED, ENDURO, MOPED, CUSTOM, CLASSIC

## Regioner (Blocket)
Stockholm, Göteborg, Malmö, Uppsala, Västra Götaland, Skåne, etc.
Använd `get_regions` för komplett lista.

**OBS:** Tradera har ingen regionfiltrering — alla Tradera-sökningar är rikstäckande.

## Rate Limits
- **Blocket**: 5 anrop/sekund (5 min cache)
- **Tradera**: 100 anrop/24 timmar (30 min cache)

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — använd tabeller med pris, titel, plats
4. **Ange källa**: "Källa: Blocket" / "Källa: Tradera"
5. **Tradera-budget**: Max 100 API-anrop/dygn — var sparsam med Tradera-sökningar

## Felsökning
- **Tradera returnerar tomt**: API-budgeten kan vara slut (100/dygn)
- **Blocket 429**: Rate limit — max 5 anrop/sekund
- **Inga resultat**: Prova bredare söktermer eller annan region
