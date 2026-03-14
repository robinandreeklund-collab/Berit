/**
 * Static MCP resources for the SMHI MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'smhi://documentation',
    name: 'SMHI MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 10 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'smhi://parameters',
    name: 'SMHI Parametrar — Referens',
    description: 'Alla tillgängliga parametrar för observationer och prognoser.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'smhi://stations',
    name: 'SMHI Stationer — Referens',
    description: 'Vanliga mätstationer i Sverige med ID och koordinater.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# SMHI MCP Server v1.0

10 verktyg för väder-, hydrologisk-, oceanografisk- och brandriskdata från SMHI.

## API:er

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| metfcst/pmp3g | opendata-download-metfcst.smhi.se | Väderprognoser (~10 dagar) |
| metfcst/snow1g | opendata-download-metfcst.smhi.se | Snöprognoser |
| metanalys/mesan2g | opendata-download-metanalys.smhi.se | Väderanalys (MESAN) |
| metobs | opendata-download-metobs.smhi.se | Väderobservationer |
| hydroobs | opendata-download-hydroobs.smhi.se | Hydrologiska observationer |
| pthbv | opendata-download-pthbv.smhi.se | Hydrologiska prognoser |
| ocobs | opendata-download-ocobs.smhi.se | Oceanografiska observationer |
| metfcst/fwif1g | opendata-download-metfcst.smhi.se | Brandriskprognoser |
| metanalys/fwia | opendata-download-metanalys.smhi.se | Brandriskanalyser |

## Autentisering

Ingen autentisering krävs — alla SMHI:s Open Data API:er är öppna.

## Verktyg

| Kategori | Antal | Verktyg |
|----------|-------|---------|
| Väderprognoser | 2 | metfcst, snow |
| Väderanalyser | 1 | mesan |
| Väderobservationer | 2 | metobs, stationer |
| Hydrologi | 2 | hydroobs, pthbv |
| Oceanografi | 1 | ocobs |
| Brandrisk | 2 | fwif, fwia |

## Cache

- Prognoser: 30 minuter
- Analyser: 15 minuter
- Observationer: 5 minuter
- Metadata: 1 timme
`;

const PARAMETERS_CONTENT = `# SMHI Parametrar

## Väderobservationer (metobs)

| ID | Parameter | Beskrivning |
|----|-----------|-------------|
| 1 | Lufttemperatur | Momentanvärde, 1 gång/tim (°C) |
| 2 | Lufttemperatur | Medelvärde 1 dygn (°C) |
| 3 | Vindriktning | Medelvärde 10 min, 1 gång/tim (°) |
| 4 | Vindhastighet | Medelvärde 10 min, 1 gång/tim (m/s) |
| 5 | Nederbördsmängd | Summa 1 dygn (mm) |
| 6 | Relativ luftfuktighet | Momentanvärde, 1 gång/tim (%) |
| 7 | Nederbördsmängd | Summa 1 timme (mm) |
| 8 | Snödjup | Momentanvärde, 1 gång/dygn (m) |
| 9 | Lufttryck | Havsytans nivå, momentan (hPa) |
| 10 | Solskenstid | Summa 1 timme (s) |
| 12 | Sikt | Momentanvärde (m) |
| 16 | Total molnmängd | Momentanvärde (%) |
| 19 | Lufttemperatur | Min, 1 gång/dygn (°C) |
| 20 | Lufttemperatur | Max, 1 gång/dygn (°C) |
| 21 | Byvind | Max, 1 gång/tim (m/s) |
| 39 | Daggpunktstemperatur | Momentanvärde (°C) |

## Hydrologiska observationer (hydroobs)

| ID | Parameter | Enhet |
|----|-----------|-------|
| 1 | Vattenföring | m³/s (dygn) |
| 2 | Vattenföring | m³/s (15 min) |
| 3 | Vattenstånd | cm |
| 4 | Vattendragstemperatur | °C |

## Oceanografiska observationer (ocobs)

| ID | Parameter | Enhet |
|----|-----------|-------|
| 1 | Signifikant våghöjd | m |
| 2 | Strömriktning | ° |
| 3 | Strömhastighet | cm/s |
| 4 | Salthalt | PSU |
| 5 | Havstemperatur | °C |
| 6 | Havsvattenstånd | cm |
| 9 | Vågperiod, peak | s |
| 11 | Maximal våghöjd | m |
| 15 | Syrehalt | ml/l |

## Brandriskparametrar (fwif/fwia)

| Parameter | Beskrivning |
|-----------|-------------|
| fwi | Forest Fire Weather Index |
| isi | Initial Fire Spread Index |
| bui | Fire Buildup Index |
| ffmc | Fine Fuel Moisture Code |
| dmc | Duff Moisture Code |
| dc | Drought Code |
| forestdry | Index för skogstorka |
| grassfire | Index för gräsbrand |
`;

const STATIONS_CONTENT = `# Vanliga SMHI-stationer

## Väderobservationer

| Stations-ID | Namn | Lat | Lon |
|-------------|------|-----|-----|
| 98210 | Stockholm | 59.35 | 18.06 |
| 97200 | Bromma | 59.35 | 17.95 |
| 71420 | Göteborg | 57.72 | 12.00 |
| 52350 | Malmö | 55.57 | 13.07 |
| 53430 | Lund | 55.72 | 13.22 |
| 180940 | Kiruna | 67.86 | 20.22 |
| 162860 | Luleå | 65.55 | 22.11 |
| 140480 | Umeå | 63.81 | 20.29 |
| 127040 | Östersund | 63.18 | 14.49 |
| 78400 | Visby | 57.66 | 18.35 |
| 93140 | Karlstad | 59.37 | 13.47 |
| 85250 | Linköping | 58.40 | 15.53 |
| 86340 | Norrköping | 58.59 | 16.15 |

## Koordinater för prognoser

Prognoser och analyser kräver lat/lon istället för stations-ID:

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
| Karlstad | 59.3793 | 13.5036 |
| Linköping | 58.4108 | 15.6214 |

Använd \`smhi_vaderobservationer_stationer\` för att hitta fler stationer.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'smhi://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'smhi://parameters':
      return { content: PARAMETERS_CONTENT, mimeType: 'text/markdown' };
    case 'smhi://stations':
      return { content: STATIONS_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
