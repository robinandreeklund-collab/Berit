---
name: swedish-police-events
description: Använd denna färdighet när användaren frågar om polishändelser, brott, polisen, brottslighet, olyckor, trafikolyckor, misshandel, stöld, inbrott, rån, skjutningar, polisrapporter, brottsstatistik i realtid, eller vad som händer i en svensk stad enligt polisen.
---

# Polishändelser (Polisen MCP v1.0)

## Översikt
1 verktyg för att hämta aktuella polishändelser från Polisen.se.

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `polisen_events` | Hämta polishändelser med plats- och typfilter |

## Arbetsflöde

1. **Hämta händelser** — Använd `polisen_events` med valfritt location- och type-filter
2. **Presentera** — Visa i tabell med datum, typ, plats och sammanfattning

## Filter-parametrar

- **location**: Länsnamn (t.ex. "Stockholms län", "Skåne län")
- **type**: Händelsetyp (t.ex. "Misshandel", "Trafikolycka", "Brand")
- **limit**: Max antal händelser (standard: 20)

## Vanliga händelsetyper

Misshandel, Stöld, Inbrott, Trafikolycka, Brand, Rån, Skottlossning,
Narkotikabrott, Bedrägeri, Olaga hot, Rattfylleri, Mord/dråp

## KRITISKA REGLER
1. **Max 3 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Polisen.se"
