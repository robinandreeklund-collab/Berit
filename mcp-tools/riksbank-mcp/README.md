# Riksbank MCP Server v1.0

MCP-server för ekonomisk data från Sveriges Riksbank. 8 verktyg via tre REST-API:er.

## API:er

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| SWEA | `api.riksbank.se/swea/v1/` | Räntor (~60 serier) och växelkurser (~50 serier) |
| SWESTR | `api.riksbank.se/swestr/v1/` | Svensk dagslåneränta (referensränta) |
| Prognoser | `api.riksbank.se/forecasts/v1/` | Makroekonomiska prognoser och utfall |

## Verktyg (8 st)

| Verktyg | Kategori | API | Beskrivning |
|---------|----------|-----|-------------|
| `riksbank_ranta_styrranta` | Räntor | SWEA | Styrränta (reporänta) och historik |
| `riksbank_ranta_marknadsrantor` | Räntor | SWEA | STIBOR, statsobligationer, bostadsräntor |
| `riksbank_valuta_kurser` | Valuta | SWEA | Valutakurser mot SEK |
| `riksbank_valuta_korskurser` | Valuta | SWEA | Korskurs mellan två valutor |
| `riksbank_swestr` | SWESTR | SWESTR | Svensk dagslåneränta |
| `riksbank_prognos_inflation` | Prognos | Prognoser | KPI, KPIF-prognoser |
| `riksbank_prognos_bnp` | Prognos | Prognoser | BNP-prognoser |
| `riksbank_prognos_ovrigt` | Prognos | Prognoser | Övriga makroprognoser |

## Användning

```bash
# Installera och bygg
npm install
npm run build

# Starta HTTP-server (port 3000)
npm start

# Starta stdio-transport
npm run start:stdio

# Kör tester
npm test
```

## Miljövariabler

| Variabel | Standard | Beskrivning |
|----------|---------|-------------|
| `RIKSBANK_API_KEY` | (tom) | API-nyckel (valfri — funkar anonymt med 5 req/min) |
| `PORT` | 3000 | HTTP-serverns port |

## Autentisering

| Nivå | Anrop/min | Tak |
|------|-----------|-----|
| Anonym | 5/min | 1 000/dag |
| Registrerad | 200/min | 30 000/vecka |

Registrera dig på [developer.api.riksbank.se](https://developer.api.riksbank.se/) för en API-nyckel.

## Källa

All data: "Källa: Sveriges Riksbank"
