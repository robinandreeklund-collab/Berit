---
name: swedish-police-events
description: Använd denna färdighet när användaren frågar om polishändelser, brott, polisen, brottslighet, olyckor, trafikolyckor, misshandel, stöld, inbrott, rån, skjutningar, polisrapporter, brottsstatistik i realtid, rattfylleri, narkotikabrott, brand, ordningsstörning, försvunnen person, eller vad som händer i en svensk stad enligt polisen. Denna färdighet använder Polisen MCP-verktyget för att hämta data direkt från Polisen.se API.
mcp-servers: [polisen]
---

# Polishändelser (Polisen MCP v1.0)

## Översikt

1 verktyg för att hämta aktuella polishändelser från Polisen.se. Data uppdateras var 5–10 minut och innehåller händelser från hela Sverige med typ, plats, sammanfattning och GPS-koordinater.

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `polisen_events` | Hämta polishändelser med plats- och typfilter |

## Arbetsflöde

### Frågor om händelser i ett specifikt län

1. `polisen_events(location="Stockholms län", limit=20)` → senaste händelserna i Stockholm

### Frågor om en specifik brottstyp

1. `polisen_events(type="Trafikolycka", limit=20)` → senaste trafikolyckorna i hela Sverige

### Frågor om händelser i ett län + specifik typ

1. `polisen_events(location="Skåne län", type="Misshandel", limit=20)` → misshandel i Skåne

### "Vad händer just nu?"

1. `polisen_events(limit=30)` → senaste 30 händelserna i hela Sverige

## Parametrar

### location — Län (fullständigt namn)

| Län |
|-----|
| Stockholms län |
| Uppsala län |
| Södermanlands län |
| Östergötlands län |
| Jönköpings län |
| Kronobergs län |
| Kalmar län |
| Gotlands län |
| Blekinge län |
| Skåne län |
| Hallands län |
| Västra Götalands län |
| Värmlands län |
| Örebro län |
| Västmanlands län |
| Dalarnas län |
| Gävleborgs län |
| Västernorrlands län |
| Jämtlands län |
| Västerbottens län |
| Norrbottens län |

### type — Händelsetyp

| Typ | Beskrivning |
|-----|-------------|
| Misshandel | Misshandel |
| Stöld | Stöld |
| Inbrott | Inbrott |
| Trafikolycka | Trafikolycka |
| Brand | Brand |
| Rån | Rån |
| Skottlossning | Skottlossning |
| Narkotikabrott | Narkotikabrott |
| Bedrägeri | Bedrägeri |
| Olaga hot | Olaga hot |
| Motorfordon, anträffat stulet | Stulet fordon |
| Rattfylleri | Rattfylleri |
| Mord/dråp | Mord/dråp |
| Djur | Djurrelaterade händelser |
| Ordningslagen | Ordningslagen |
| Arbetsplatsolycka | Arbetsplatsolycka |

OBS: Polisens API kan returnera fler händelsetyper utöver dessa. Filtreringen är case-sensitive.

### limit — Max antal

- Min: 1, Max: 500, Standard: 20

## KRITISKA REGLER

1. **Max 3 verktygsanrop per fråga** — ett anrop räcker oftast
2. **Om verktyget misslyckas — försök INTE igen.** Svara med vad du har
3. **Presentera data överskådligt** — använd tabeller med datum, typ, plats och sammanfattning
4. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults (t.ex. limit=20)
5. **Ange källa**: "Källa: Polisen.se"

## Exempelfrågor och arbetsflöden

### "Polishändelser i Göteborg?"

1. `polisen_events(location="Västra Götalands län", limit=20)` → senaste händelserna

### "Har det hänt något med skjutningar i Stockholm?"

1. `polisen_events(location="Stockholms län", type="Skottlossning", limit=20)` → skjutningar

### "Trafikolyckor idag?"

1. `polisen_events(type="Trafikolycka", limit=30)` → senaste trafikolyckor hela Sverige

### "Vad händer i Malmö?"

1. `polisen_events(location="Skåne län", limit=20)` → OBS: Polisen filtrerar på län, inte stad

## Felsökning

- **Tom data:** Inga händelser matchar filtret just nu — normalt, särskilt för ovanliga typer
- **Oklart län:** Polisen använder länsnamn, inte stadsnamn. "Malmö" → "Skåne län", "Göteborg" → "Västra Götalands län"
- **Timeout:** Polisens API kan vara långsamt — försök inte igen, informera användaren
