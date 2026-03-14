# Kolada MCP Server v1.0

MCP-server for svensk kommunstatistik from Kolada (RKA — Rådet for främjande av kommunala analyser). 10 verktyg via Kolada API v2.

## API

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Kolada v2 | `api.kolada.se/v2/` | Nyckeltal, kommuner, enheter, kommungrupper |

## Verktyg (10 st)

| Verktyg | Kategori | Beskrivning |
|---------|----------|-------------|
| `kolada_sok_nyckeltal` | Sök | Sök nyckeltal (KPI:er) efter namn |
| `kolada_sok_kommun` | Sök | Sök kommuner efter namn |
| `kolada_sok_enhet` | Sök | Sök organisatoriska enheter |
| `kolada_data_kommun` | Data | KPI-värden för en specifik kommun |
| `kolada_data_alla_kommuner` | Data | KPI-värden för alla kommuner |
| `kolada_data_enhet` | Data | KPI-värden per organisatorisk enhet |
| `kolada_nyckeltal_detalj` | Data | Detaljerad KPI-metadata |
| `kolada_jamfor_kommuner` | Jämförelse | Jämför kommuner på ett nyckeltal |
| `kolada_trend` | Jämförelse | Trenddata över flera år |
| `kolada_kommungrupper` | Referens | Lista kommungrupper |

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
| `PORT` | 3000 | HTTP-serverns port |

## Autentisering

Kolada API:t är öppet och kräver ingen API-nyckel.

## Källa

All data: "Källa: Kolada / RKA (Rådet för främjande av kommunala analyser)"
