---
name: swedish-municipality-stats
description: Använd denna färdighet när användaren frågar om kommunstatistik, kommunal statistik, Kolada, kommun, kommuner, nyckeltal, KPI, kommunjämförelse, skolresultat, kommunranking, äldreomsorg, barnomsorg, hemtjänst, socialtjänst, kommunalekonomi, skattesats, befolkningsstatistik, demografisk data, regional statistik, landsting, region, organisationsenhet, verksamhetsdata, eller vill jämföra kommuner i Sverige.
mcp-servers: [kolada]
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
| N01951 | Invånare totalt, antal |
| N01963 | Befolkningsförändring sedan föregående år (%) |
| N01920 | Invånare 0-18 år, antal |
| N00980 | Äldre äldre av invånare 65+, andel (%) |
| N02267 | Sysselsättningsgrad 20-64 år, andel (%) |
| N02280 | Arbetslöshet 20-64 år, andel (%) |
| N00901 | Skattesats till kommun (%) |
| N15006 | Kostnad grundskola åk 1-9, kr/elev |
| N15504 | Meritvärde åk 9, genomsnitt (17 ämnen) |
| N20891 | Invånare 65+ i särskilt boende/hemtjänst, andel (%) |

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

**Fråga:** "Hur många bor i Örebro?"
**Svar:** Örebro = 1880, Invånare totalt = N01951 (kända ID:n!)
→ 1 anrop: `kolada_data_kommun(kpi_id="N01951", kommun_id="1880", from_year=2020, to_year=2024)`

**Fråga:** "Jämför skolresultat mellan Malmö och Lund"
**Svar:** Malmö = 1280, Lund = 1281, Meritvärde = N15504 (kända ID:n!)
→ 1 anrop: `kolada_jamfor_kommuner(kpi_id="N15504", kommun_ids="1280,1281")`

**Fråga:** "Hur är arbetsmarknaden i Göteborg?"
**Svar:** Göteborg = 1480, Sysselsättningsgrad = N02267 (kända ID:n!)
→ 1 anrop: `kolada_data_kommun(kpi_id="N02267", kommun_id="1480", from_year=2020, to_year=2024)`

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
