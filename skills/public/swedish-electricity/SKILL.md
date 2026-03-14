---
name: swedish-electricity
description: Använd denna färdighet när användaren frågar om elpriser, elpris, spotpris, spotpriser, elkostnad, elkostnader, elräkning, kilowattimme, kWh, priszon, priszoner, SE1, SE2, SE3, SE4, elpriset just nu, elprisetjustnu, billig el, dyr el, elprisjämförelse, zonjämförelse, elprishistorik, elprisutveckling, elavtal, rörligt elavtal, timpriser, timpris, energipris, energipriser, elmarknad, nordpool, elspot, svensk el, elnät, elnätsavgift, elförbrukning. Denna färdighet använder Elpris MCP-verktygen för att hämta spotpriser direkt från elprisetjustnu.se.
---

# Svenska Elpriser (Elpris MCP v1.0)

## Översikt

Denna färdighet ger dig tillgång till svenska elpriser (spotpriser) via elprisetjustnu.se. Du har 4 verktyg: dagens priser, morgondagens priser, historik och zonjämförelse.

## Tillgängliga MCP-verktyg

### Priser (2 verktyg)

| Verktyg | Beskrivning |
|---------|-------------|
| `elpris_idag` | Hämta dagens elpriser per timme för en zon |
| `elpris_imorgon` | Hämta morgondagens elpriser (publiceras efter kl 13:00) |

### Historik (1 verktyg)

| Verktyg | Beskrivning |
|---------|-------------|
| `elpris_historik` | Hämta historiska elpriser (max 31 dagar per anrop) |

### Jämförelse (1 verktyg)

| Verktyg | Beskrivning |
|---------|-------------|
| `elpris_jamforelse` | Jämför elpriser mellan alla 4 priszoner |

## Priszoner

| Zon | Område |
|-----|--------|
| SE1 | Luleå (norra Sverige) |
| SE2 | Sundsvall (mellersta Sverige) |
| SE3 | Stockholm (södra Mellansverige) |
| SE4 | Malmö (södra Sverige) |

## Arbetsflöde

### Frågor om dagens elpris

1. `elpris_idag(zon="SE3")` — standard: SE3 om ej specificerat
2. Presentera timpriser i tabell, lyft fram billigaste och dyraste timmarna

### Frågor om morgondagens priser

1. `elpris_imorgon(zon="SE3")` — OBS: publiceras normalt efter kl 13:00
2. Om priser ej tillgängliga, informera användaren

### Frågor om historiska priser

1. `elpris_historik(zon="SE3", fromDate="2025-01-01", toDate="2025-01-31")` — max 31 dagar
2. Presentera dagliga snittpriser

### Frågor om prisjämförelse

1. `elpris_jamforelse()` — jämför alla 4 zoner idag
2. Kommentera prisskillnader norr/söder

## KRITISKA REGLER

1. **Max 4 verktygsanrop per fråga** — välj rätt verktyg direkt, sedan SVAR
2. **Datumformat: YYYY-MM-DD** — "2025-01-15"
3. **Om ett verktyg misslyckas — försök INTE igen.** Svara med vad du har
4. **Presentera data överskådligt** — använd tabeller
5. **Fråga INTE användaren** om förtydligande — standardzon SE3 (Stockholm)
6. **Ange att priserna exkluderar moms och avgifter** (elnätsavgift, energiskatt)
7. **Ange källa**: "Källa: elprisetjustnu.se"

## Exempelfrågor och arbetsflöden

### "Vad kostar elen idag?"

1. `elpris_idag(zon="SE3")` → timpriser Stockholm

### "Jämför elpriser norr/söder"

1. `elpris_jamforelse()` → alla 4 zoner

### "Elprisutveckling förra veckan"

1. `elpris_historik(zon="SE3", fromDate="...", toDate="...")` → dagliga snitt

### "Elpris imorgon Malmö"

1. `elpris_imorgon(zon="SE4")` → timpriser SE4

## Felsökning

- **404-fel**: Data finns inte för detta datum (för tidigt eller framtida datum)
- **Tom sökning**: Morgondagens priser publiceras efter kl 13:00
- **Max 31 dagar**: Dela upp längre perioder i flera anrop
