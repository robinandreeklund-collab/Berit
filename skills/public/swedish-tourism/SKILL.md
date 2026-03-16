---
name: swedish-tourism
description: Använd denna färdighet när användaren frågar om turism i Sverige, sevärdheter, turistmål, hotell, boenden, restauranger, evenemang, festivaler, konserter, Visit Sweden, resmål, semester, besöksmål, attraktioner, camping, vandrarhem, vad man kan göra i en svensk stad eller region, semester i Sverige, utflykter, museer, nöjesparker, naturupplevelser, vandring, eller tips för besök i Sverige. Denna färdighet använder Visit Sweden MCP-verktygen för att hämta data direkt från Visit Swedens öppna dataplattform (data.visitsweden.com).
mcp-servers: [visitsweden]
---

# Svensk Turism (Visit Sweden MCP v1.0)

## Översikt

4 verktyg för att söka turistinformation i Sverige via Visit Swedens öppna dataplattform (data.visitsweden.com). Täcker sevärdheter, boenden, restauranger och evenemang i hela Sverige.

**Datakälla:** EntryStore-baserad linked data med schema.org-typer.

## Tillgängliga MCP-verktyg

### Sökning

| Verktyg | Beskrivning |
|---------|-------------|
| `visitsweden_search` | Sök platser, boenden, restauranger eller evenemang |
| `visitsweden_search_events` | Sök evenemang med datumfilter |
| `visitsweden_nearby` | Hitta attraktioner/boenden nära en plats |

### Detaljer

| Verktyg | Beskrivning |
|---------|-------------|
| `visitsweden_get_details` | Hämta fullständig info om en specifik post via entry-ID |

## Arbetsflöde

### Frågor om sevärdheter/platser

1. `visitsweden_search(query="Göteborg", type="Place", limit=10)` → sevärdheter i Göteborg
2. Vid intressant träff → `visitsweden_get_details(entryId="107/42")` → fullständig info

### Frågor om hotell/boenden

1. `visitsweden_search(query="Kiruna", type="LodgingBusiness", limit=10)` → hotell i Kiruna

### Frågor om restauranger

1. `visitsweden_search(query="Visby", type="FoodEstablishment", limit=10)` → restauranger i Visby

### Frågor om evenemang

1. `visitsweden_search_events(query="Stockholm", fromDate="2026-06-01", toDate="2026-06-30")` → evenemang i juni
2. Alternativt: `visitsweden_search_events(query="festival")` → festivaler 30 dagar framåt

### "Vad finns nära X?"

1. `visitsweden_nearby(place="Hjo", type="Place", limit=10)` → sevärdheter nära Hjo
2. `visitsweden_nearby(place="Abisko", type="LodgingBusiness")` → boenden nära Abisko

## Parametrar

### type — Entitetstyp

| Typ | Beskrivning | Sök med |
|-----|-------------|---------|
| Event | Evenemang, festivaler, konserter | `visitsweden_search` eller `visitsweden_search_events` |
| LodgingBusiness | Hotell, vandrarhem, camping, B&B | `visitsweden_search` eller `visitsweden_nearby` |
| Place | Platser, sevärdheter, attraktioner | `visitsweden_search` eller `visitsweden_nearby` |
| FoodEstablishment | Restauranger, caféer, barer | `visitsweden_search` eller `visitsweden_nearby` |

### region — Region (intern nyckel)

| Nyckel | Region |
|--------|--------|
| stockholm | Stockholm |
| skane | Skåne |
| vastra_gotaland | Västra Götaland |
| dalarna | Dalarna |
| gotland | Gotland |
| norrbotten | Norrbotten |
| jamtland | Jämtland Härjedalen |
| halland | Halland |
| blekinge | Blekinge |
| gavleborg | Gävleborg |
| jonkoping | Jönköping |
| kalmar | Kalmar |
| kronoberg | Kronoberg |
| sodermanland | Södermanland |
| uppland | Uppland |
| varmland | Värmland |
| vasterbotten | Västerbotten |
| vasternorrland | Västernorrland |
| vastmanland | Västmanland |
| orebro | Örebro |
| ostergotland | Östergötland |

### Datumformat

- Format: `YYYY-MM-DD` (t.ex. "2026-06-15")
- `fromDate` standard: idag
- `toDate` standard: 30 dagar framåt

## KRITISKA REGLER

1. **Max 4 verktygsanrop per fråga** — sök först, detaljer sedan om behövs
2. **Om ett verktyg misslyckas — försök INTE igen.** Svara med vad du har
3. **Använd type-parameter** — det ger mycket bättre resultat
4. **Presentera data överskådligt** — använd tabeller med namn, typ och beskrivning
5. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults
6. **Ange källa**: "Källa: Visit Sweden (data.visitsweden.com)"
7. **Entry-ID** — spara alltid entry-ID från sökresultat, det behövs för `visitsweden_get_details`

## Exempelfrågor och arbetsflöden

### "Sevärdheter i Göteborg?"

1. `visitsweden_search(query="Göteborg", type="Place", limit=10)` → platser/attraktioner

### "Hotell i Stockholm?"

1. `visitsweden_search(query="Stockholm", type="LodgingBusiness", limit=10)` → boenden

### "Vad händer i Malmö nästa helg?"

1. `visitsweden_search_events(query="Malmö", fromDate="2026-03-21", toDate="2026-03-23")` → evenemang

### "Restauranger nära Visby?"

1. `visitsweden_nearby(place="Visby", type="FoodEstablishment", limit=10)` → restauranger

### "Berätta mer om STF Zinkensdamm"

1. `visitsweden_search(query="Zinkensdamm", type="LodgingBusiness")` → hitta entry-ID
2. `visitsweden_get_details(entryId="107/42")` → fullständig info

## Felsökning

- **Inga resultat:** Prova enklare sökterm (bara stadsnamn), ta bort type-filter
- **HTTP 400:** Ogiltiga sökparametrar — förenkla frågan, ta bort datum/region-filter
- **Timeout:** Visit Sweden API kan vara långsamt — försök inte igen
- **Entry-ID:** Formatet är "contextId/entryId" (t.ex. "107/42") — hämtas från sökresultat
