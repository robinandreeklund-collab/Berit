---
name: swedish-weather
description: Använd denna färdighet när användaren frågar om svenskt väder, väderprognos, temperatur, vind, nederbörd, regn, snö, snöprognos, SMHI, väderanalys, MESAN, väderobservationer, mätstation, vattenstånd, vattenföring, hydrologi, havsnivå, havstemperatur, våghöjd, oceanografi, brandrisk, skogsbrand, gräsbrand, FWI, eldningsförbud, meteorologi, klimatdata, eller väderleksrapport i Sverige. Denna färdighet använder SMHI MCP-verktygen för att hämta data direkt från SMHI:s öppna API:er.
mcp-servers: [smhi]
---

# Svenskt Väder (SMHI MCP v1.1)

## Översikt

Denna färdighet ger dig tillgång till väder-, hydrologisk-, oceanografisk- och brandriskdata via SMHI:s öppna API:er. Du har 9 verktyg i 6 kategorier.

**Automatisk geocoding:** Prognoser och analyser accepterar platsnamn (t.ex. "Tibro") istället för koordinater — systemet konverterar automatiskt.

## Tillgängliga MCP-verktyg

### Väderprognoser (Temperatur, Vind, Nederbörd)

| Verktyg | Beskrivning |
|---------|-------------|
| `smhi_vaderprognoser_metfcst` | Väderprognos ~10 dagar framåt (temperatur, vind, nederbörd, moln, vädersymbol) |
| `smhi_vaderprognoser_snow` | Snöprognos för en plats |

### Väderanalyser (Aktuellt Väder)

| Verktyg | Beskrivning |
|---------|-------------|
| `smhi_vaderanalyser_mesan` | Senaste väderanalys (MESAN) — aktuellt väder baserat på mätdata + modell |

### Väderobservationer (Mätdata)

| Verktyg | Beskrivning |
|---------|-------------|
| `smhi_vaderobservationer_metobs` | Uppmätt väderdata från specifik mätstation |
| `smhi_vaderobservationer_stationer` | Lista alla mätstationer som mäter en viss parameter |

### Hydrologi (Vattenstånd, Vattenföring)

| Verktyg | Beskrivning |
|---------|-------------|
| `smhi_hydrologi_hydroobs` | Hydrologiska observationer (vattenstånd, vattenföring, temperatur) |

### Oceanografi (Hav, Vågor)

| Verktyg | Beskrivning |
|---------|-------------|
| `smhi_oceanografi_ocobs` | Havstemperatur, vattenstånd, våghöjd, salthalt |

### Brandrisk (FWI, Skogsbrand) — Säsongsbaserat (maj–oktober)

| Verktyg | Beskrivning |
|---------|-------------|
| `smhi_brandrisk_fwif` | Brandriskprognos (FWI-index) kommande dagar |
| `smhi_brandrisk_fwia` | Brandriskanalys (aktuell) |

## Arbetsflöde

### Frågor om väderprognos

1. `smhi_vaderprognoser_metfcst(location="Stockholm")` → prognos ~10 dagar
   - Alternativt: `smhi_vaderprognoser_metfcst(latitude=59.3293, longitude=18.0686)`

### Frågor om aktuellt väder

1. `smhi_vaderanalyser_mesan(location="Göteborg")` → aktuellt väder

### Frågor om historiska mätningar

1. Identifiera parameter (1=temp, 4=vind, 5=nederbörd)
2. Identifiera station (97200=Bromma, 71420=Göteborg, 52350=Malmö)
3. `smhi_vaderobservationer_metobs(parameter, station, period)` → mätdata
4. Om okänd station → `smhi_vaderobservationer_stationer(parameter)` först

### Frågor om vattenstånd/hydrologi

1. `smhi_hydrologi_hydroobs(parameter, station, period)` → observationer

### Frågor om havsdata

1. `smhi_oceanografi_ocobs(parameter, station, period)` → havsdata

### Frågor om brandrisk

1. `smhi_brandrisk_fwia(location="Gotland")` → aktuell brandrisk
2. `smhi_brandrisk_fwif(location="Stockholm")` → brandriskprognos
3. **OBS:** Data finns bara under brandsäsongen (ca maj–oktober)

## Vanliga stationer (metobs/hydroobs)

| ID | Namn |
|----|------|
| 97200 | Bromma (Stockholm) |
| 98210 | Stockholm |
| 71420 | Göteborg |
| 52350 | Malmö |
| 53430 | Lund |
| 180940 | Kiruna |

## KRITISKA REGLER

1. **Max 4 verktygsanrop per fråga** — välj rätt verktyg direkt, sedan SVAR
2. **Använd location-parameter** — ange platsnamn (t.ex. "Tibro") direkt, lat/lon behövs ej
3. **Om ett verktyg misslyckas — försök INTE igen.** Svara med vad du har
4. **Presentera data överskådligt** — använd tabeller
5. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults
6. **Ange källa**: "Källa: SMHI (smhi.se)"
7. **Brandrisk returnerar 404 utanför brandsäsongen** — informera användaren

## Exempelfrågor och arbetsflöden

### "Vädret i Tibro?"

1. `smhi_vaderprognoser_metfcst(location="Tibro")` → prognos (geocoding sker automatiskt)

### "Temperatur Malmö just nu?"

1. `smhi_vaderanalyser_mesan(location="Malmö")` → aktuellt

### "Snöar det i Kiruna?"

1. `smhi_vaderprognoser_metfcst(location="Kiruna")` → kolla Wsymb2-koder 15-17, 25-27

### "Brandrisk Gotland?"

1. `smhi_brandrisk_fwif(location="Gotland")` → FWI-prognos (OBS: bara maj–okt)

## Felsökning

- **404-fel:** Koordinater utanför Sverige, ogiltigt stations-/parameter-ID, eller brandrisk utanför säsong
- **Tom data:** Prova annan period (latest-hour → latest-day)
- **Hitta station:** Använd `smhi_vaderobservationer_stationer` med rätt parameter-ID
- **Geocoding misslyckas:** Ange koordinater (latitude/longitude) direkt istället
