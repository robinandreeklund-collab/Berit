/**
 * LLM instructions for the Elpris MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Elpris MCP — Instruktioner

Du har tillgång till 4 verktyg för att hämta svenska elpriser (spotpriser) från elprisetjustnu.se.

## Verktyg

- **elpris_idag** — Dagens elpriser per timme för en zon
- **elpris_imorgon** — Morgondagens elpriser (publiceras efter kl 13:00)
- **elpris_historik** — Historiska elpriser (max 31 dagar per anrop)
- **elpris_jamforelse** — Jämför priser mellan alla 4 zoner

## Priszoner

| Zon | Område |
|-----|--------|
| SE1 | Luleå (norra Sverige) |
| SE2 | Sundsvall (mellersta Sverige) |
| SE3 | Stockholm (södra Mellansverige) |
| SE4 | Malmö (södra Sverige) |

## Arbetsflöde

1. **Identifiera** — Vill användaren se dagens, morgondagens, historiska eller jämförelsepriser?
2. **Välj zon** — Standard: SE3 (Stockholm) om ej angivet
3. **Ange datumfilter** — Datumformat: YYYY-MM-DD
4. **Presentera data** — Visa i tabell, notera att priserna exkluderar moms och avgifter

## Tips

- Priser anges exkl. moms, elnätsavgift och energiskatt
- 15-minutersintervall i prisdata
- Data tillgänglig från 2022-11-01
- Morgondagens priser publiceras normalt efter kl 13:00
- Cache: 15 min aktuella priser, 24 timmar historisk data
`;
