# Riksdag MCP Server v1.0

MCP server for Swedish Parliament (Riksdagen) and Government (Regeringskansliet) data.

## 15 verktyg

| Kategori | Verktyg | Beskrivning |
|----------|---------|-------------|
| Sök (4) | `riksdag_sok_dokument` | Sök riksdagsdokument (motioner, propositioner, etc.) |
| | `riksdag_sok_ledamoter` | Sök riksdagsledamöter |
| | `riksdag_sok_anforanden` | Sök anföranden/debatter |
| | `riksdag_sok_voteringar` | Sök voteringar |
| Hämta (5) | `riksdag_hamta_dokument` | Hämta specifikt dokument |
| | `riksdag_hamta_ledamot` | Hämta ledamotprofil |
| | `riksdag_hamta_motioner` | Senaste motioner |
| | `riksdag_hamta_propositioner` | Senaste propositioner |
| | `riksdag_hamta_utskott` | Lista utskott |
| Regering (3) | `riksdag_regering_sok` | Sök regeringsdokument |
| | `riksdag_regering_dokument` | Hämta regeringsdokument |
| | `riksdag_regering_departement` | Dokument per departement |
| Kalender & Analys (3) | `riksdag_kalender` | Kalenderhändelser |
| | `riksdag_kombinerad_sok` | Kombinerad sökning |
| | `riksdag_statistik` | Tillgängliga datakällor |

## API:er

- **Riksdagen**: `data.riksdagen.se` — Dokument, ledamöter, anföranden, voteringar
- **Regeringskansliet**: `g0v.se` — Pressmeddelanden, propositioner, SOU, DS

Inga API-nycklar krävs.

## Installation

```bash
npm install
npm run build
```

## Användning

```bash
# HTTP server (port 3000)
npm start

# Stdio transport
npm run start:stdio
```

## Utveckling

```bash
npm run dev    # TypeScript watch mode
npm test       # Kör tester
```
