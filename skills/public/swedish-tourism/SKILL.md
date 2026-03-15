---
name: swedish-tourism
description: Använd denna färdighet när användaren frågar om turism i Sverige, sevärdheter, turistmål, hotell, boenden, restauranger, evenemang, festivaler, konserter, Visit Sweden, resmål, semester, besöksmål, attraktioner, camping, vandrarhem, eller vad man kan göra i en svensk stad eller region.
---

# Svensk turism (Visit Sweden MCP v1.0)

## Översikt
4 verktyg för att söka turistinformation i Sverige via Visit Swedens öppna dataplattform (data.visitsweden.com).

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `visitsweden_search` | Sök efter platser, boenden, restauranger eller evenemang |
| `visitsweden_get_details` | Hämta fullständig info om en specifik post (ID krävs) |
| `visitsweden_search_events` | Sök evenemang med datumfilter |
| `visitsweden_nearby` | Hitta attraktioner/boenden nära en plats |

## Arbetsflöde

1. **Sök** — Använd `visitsweden_search` med relevant sökterm och valfritt typfilter
2. **Evenemang** — Använd `visitsweden_search_events` med datumfilter för evenemangsfrågor
3. **Nära en plats** — Använd `visitsweden_nearby` för "nära X"-frågor
4. **Detaljer** — Använd `visitsweden_get_details` med entry-ID från steg 1-3

## Typer

| Typ | Beskrivning |
|-----|-------------|
| Event | Evenemang, festivaler, konserter |
| LodgingBusiness | Hotell, vandrarhem, camping |
| Place | Platser, sevärdheter |
| FoodEstablishment | Restauranger, caféer |

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Visit Sweden (data.visitsweden.com)"
