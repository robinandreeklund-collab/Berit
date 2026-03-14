---
name: swedish-weather
description: Använd denna färdighet när användaren frågar om svenskt väder, väderprognos, temperatur, vind, nederbörd, regn, snö, snöprognos, SMHI, väderanalys, MESAN, väderobservationer, mätstation, vattenstånd, vattenföring, hydrologi, havsnivå, havstemperatur, våghöjd, oceanografi, brandrisk, skogsbrand, gräsbrand, FWI, eldningsförbud, meteorologi, klimatdata, eller väderleksrapport i Sverige. Denna färdighet använder SMHI MCP-verktygen för att hämta data direkt från SMHI:s öppna API:er.
---

# Svenskt Väder (SMHI MCP v1.0)

## Översikt

Denna färdighet ger dig tillgång till väder-, hydrologisk-, oceanografisk- och brandriskdata via SMHI:s 9 öppna API:er. Du har 10 verktyg i 6 kategorier.

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
| `smhi_hydrologi_pthbv` | Hydrologiska prognoser (PT-HBV-modellen) |

### Oceanografi (Hav, Vågor)

| Verktyg | Beskrivning |
|---------|-------------|
| `smhi_oceanografi_ocobs` | Havstemperatur, vattenstånd, våghöjd, salthalt |

### Brandrisk (FWI, Skogsbrand)

| Verktyg | Beskrivning |
|---------|-------------|
| `smhi_brandrisk_fwif` | Brandriskprognos (FWI-index) kommande dagar |
| `smhi_brandrisk_fwia` | Brandriskanalys (aktuell) |

## Arbetsflöde

### Frågor om väderprognos

1. Identifiera plats → slå upp koordinater (Stockholm: 59.3293, 18.0686)
2. `smhi_vaderprognoser_metfcst(latitude, longitude)` → prognos ~10 dagar

### Frågor om aktuellt väder

1. Identifiera plats → koordinater
2. `smhi_vaderanalyser_mesan(latitude, longitude)` → aktuellt väder

### Frågor om historiska mätningar

1. Identifiera parameter (1=temp, 4=vind, 5=nederbörd)
2. Identifiera station (97200=Bromma, 71420=Göteborg, 52350=Malmö)
3. `smhi_vaderobservationer_metobs(parameter, station, period)` → mätdata
4. Om okänd station → `smhi_vaderobservationer_stationer(parameter)` först

### Frågor om vattenstånd/hydrologi

1. `smhi_hydrologi_hydroobs(parameter, station, period)` → observationer
2. `smhi_hydrologi_pthbv(latitude, longitude)` → prognoser

### Frågor om havsdata

1. `smhi_oceanografi_ocobs(parameter, station, period)` → havsdata

### Frågor om brandrisk

1. `smhi_brandrisk_fwia(latitude, longitude)` → aktuell brandrisk
2. `smhi_brandrisk_fwif(latitude, longitude)` → brandriskprognos

## Vanliga koordinater

| Plats | Latitud | Longitud |
|-------|---------|----------|
| Stockholm | 59.3293 | 18.0686 |
| Göteborg | 57.7089 | 11.9746 |
| Malmö | 55.6050 | 13.0038 |
| Kiruna | 67.8558 | 20.2253 |
| Luleå | 65.5848 | 22.1547 |
| Umeå | 63.8258 | 20.2630 |
| Östersund | 63.1792 | 14.6357 |
| Visby | 57.6348 | 18.2948 |

## Vanliga stationer (metobs)

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
2. **Koordinater i WGS84** — lat 55-70, lon 10-25
3. **Om ett verktyg misslyckas — försök INTE igen.** Svara med vad du har
4. **Presentera data överskådligt** — använd tabeller
5. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults
6. **Ange källa**: "Källa: SMHI (smhi.se)"

## Exempelfrågor och arbetsflöden

### "Vädret i Stockholm?"

1. `smhi_vaderprognoser_metfcst(latitude=59.3293, longitude=18.0686)` → prognos

### "Temperatur Malmö just nu?"

1. `smhi_vaderanalyser_mesan(latitude=55.6050, longitude=13.0038)` → aktuellt

### "Snöar det i Kiruna?"

1. `smhi_vaderprognoser_metfcst(latitude=67.8558, longitude=20.2253)` → kolla Wsymb2-koder 15-17, 25-27

### "Brandrisk Gotland?"

1. `smhi_brandrisk_fwif(latitude=57.6348, longitude=18.2948)` → FWI-prognos

## Felsökning

- **404-fel:** Koordinater utanför Sverige, eller ogiltigt stations-/parameter-ID
- **Tom data:** Prova annan period (latest-hour → latest-day)
- **Hitta station:** Använd `smhi_vaderobservationer_stationer` med rätt parameter-ID
