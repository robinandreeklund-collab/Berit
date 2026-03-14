---
name: swedish-municipality-stats
description: Använd denna färdighet när användaren frågar om kommunstatistik, kommunal statistik, Kolada, kommun, kommuner, nyckeltal, KPI, kommunjämförelse, skolresultat, kommunranking, äldreomsorg, barnomsorg, hemtjänst, socialtjänst, kommunalekonomi, skattesats, befolkningsstatistik, demografisk data, regional statistik, landsting, region, organisationsenhet, verksamhetsdata, eller vill jämföra kommuner i Sverige.
---

# Kolada MCP (v1.0)

## KRITISKT: Anti-loop-regler

1. **Max 4 verktygsanrop per fråga** — stoppa därefter och presentera vad du har
2. **ALDRIG samma verktyg 2 gånger med samma parametrar**
3. **Om ett verktyg misslyckas — STOPPA och förklara felet** — försök INTE igen
4. **Använd kända ID:n direkt** — sök INTE efter ID:n som redan finns i listan nedan

## Snabbstart: Kända ID:n (sök INTE efter dessa!)

### Nyckeltal
| KPI-ID | Beskrivning |
|--------|-------------|
| N00945 | Invånare totalt |
| N00941 | Befolkningsökning/-minskning |
| N01951 | Nettokostnadsavvikelse, kr/inv |
| U09400 | Elever åk 9 som uppnått kunskapskrav i alla ämnen |
| N07900 | Resultat av medborgarundersökning |
| N15033 | Kostnad per elev i grundskola |
| N28040 | Andel nöjda brukare i hemtjänst |
| N20049 | Skattesats, kommun |

### Kommuner
| ID | Kommun | | ID | Kommun |
|----|--------|-|----|--------|
| 0180 | Stockholm | | 1480 | Göteborg |
| 1280 | Malmö | | 0380 | Uppsala |
| 0580 | Linköping | | 0680 | Jönköping |
| 1880 | Örebro | | 1980 | Västerås |
| 2480 | Umeå | | 2580 | Luleå |
| 1281 | Lund | | 0480 | Norrköping |
| 2180 | Gävle | | 0780 | Växjö |
| 0980 | Gotland | | 1380 | Halmstad |

## Arbetsflöde

### Steg 1: Har du redan ID:n?
Om KPI-ID och kommun-ID finns i listorna ovan → hoppa direkt till steg 3.

### Steg 2: Sök BARA det du saknar (max 1 anrop)
- `kolada_sok_nyckeltal` — hitta KPI-ID
- `kolada_sok_kommun` — hitta kommun-ID

### Steg 3: Hämta data (ETT anrop)
- `kolada_data_kommun` — värden för en kommun (kpi_id + kommun_id + from_year + to_year)
- `kolada_trend` — trend över tid (kpi_id + kommun_id + years)
- `kolada_jamfor_kommuner` — jämför kommuner (kpi_id + kommun_ids kommaseparerade)

### Steg 4: Presentera i tabell
Ange källa: "Källa: Kolada (kolada.se)"

## Exempel

**Fråga:** "Visa nettokostnadsavvikelsen per invånare för Örebro 2020–2024"
**Svar:** Örebro = 1880, Nettokostnadsavvikelse = N01951 (kända ID:n!)
→ 1 anrop: `kolada_data_kommun(kpi_id="N01951", kommun_id="1880", from_year=2020, to_year=2024)`

**Fråga:** "Jämför skolresultat mellan Malmö och Lund"
**Svar:** Malmö = 1280, Lund = 1281, Skolresultat = U09400 (kända ID:n!)
→ 1 anrop: `kolada_jamfor_kommuner(kpi_id="U09400", kommun_ids="1280,1281")`

## Alla verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `kolada_sok_nyckeltal` | Sök nyckeltal efter titel/nyckelord |
| `kolada_sok_kommun` | Sök kommuner efter namn |
| `kolada_sok_enhet` | Sök enheter (skolor, vårdcentraler) |
| `kolada_data_kommun` | Hämta KPI-data för en kommun |
| `kolada_data_alla_kommuner` | KPI-data för alla kommuner (ett år) |
| `kolada_data_enhet` | KPI-data per enhet |
| `kolada_nyckeltal_detalj` | Detaljerad metadata om ett KPI |
| `kolada_jamfor_kommuner` | Jämför KPI mellan kommuner |
| `kolada_trend` | Visa KPI-trend i en kommun |
| `kolada_kommungrupper` | Lista kommungrupper |
