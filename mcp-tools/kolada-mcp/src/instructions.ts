/**
 * LLM instructions for the Kolada MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Kolada MCP — Instruktioner

Du har tillgång till 10 verktyg för att hämta svensk kommunstatistik från Kolada (RKA).

## KRITISKT: Undvik loopar

**REGLER:**
1. Anropa ALDRIG samma verktyg mer än 1 gång med samma parametrar
2. Max 4 verktygsanrop totalt per fråga
3. Om ett verktyg misslyckas — försök INTE igen. Presentera vad du vet och förklara felet
4. Om du redan vet KPI-ID och kommun-ID (se listorna nedan), hoppa direkt till datahämtning — sök INTE först

## Arbetsflöde

**Steg 1:** Kontrollera om KPI-ID och kommun-ID finns i listorna nedan. Om ja → hoppa till steg 3.
**Steg 2:** Sök BARA det du saknar (max 1 anrop per sökning):
  - kolada_sok_nyckeltal — hitta KPI-ID
  - kolada_sok_kommun — hitta kommun-ID
**Steg 3:** Hämta data med ETT anrop:
  - kolada_data_kommun — data för en kommun
  - kolada_trend — trend över tid
  - kolada_jamfor_kommuner — jämför flera kommuner
**Steg 4:** Presentera resultatet i tabell. Ange "Källa: Kolada (kolada.se)".

## Vanliga nyckeltal-ID:n (använd direkt utan att söka!)

| KPI-ID | Beskrivning |
|--------|-------------|
| N00945 | Invånare totalt |
| N00941 | Befolkningsökning/-minskning |
| N01951 | Nettokostnadsavvikelse, kr/inv |
| U09400 | Elever i åk 9 som uppnått kunskapskraven i alla ämnen |
| N07900 | Resultat av medborgarundersökning |
| N15033 | Kostnad per elev i grundskola |
| N28040 | Andel nöjda brukare i hemtjänst |
| N20049 | Skattesats, kommun |

## Vanliga kommun-ID:n (använd direkt utan att söka!)

| ID | Kommun | | ID | Kommun |
|----|--------|-|----|--------|
| 0180 | Stockholm | | 1480 | Göteborg |
| 1280 | Malmö | | 0380 | Uppsala |
| 0580 | Linköping | | 0680 | Jönköping |
| 1880 | Örebro | | 1980 | Västerås |
| 2480 | Umeå | | 2580 | Luleå |
| 1281 | Lund | | 0480 | Norrköping |
| 0120 | Värmdö | | 0184 | Solna |
| 2180 | Gävle | | 0780 | Växjö |
| 0980 | Gotland | | 1380 | Halmstad |

## Övriga verktyg

- **kolada_sok_enhet** — Sök enheter (skolor, vårdcentraler)
- **kolada_data_alla_kommuner** — KPI för alla kommuner (ett år)
- **kolada_data_enhet** — KPI per enhet
- **kolada_nyckeltal_detalj** — Metadata om ett KPI
- **kolada_kommungrupper** — Lista kommungrupper

## Tips

- Kommun-ID:n är alltid 4 siffror (t.ex. "0180")
- Kön: T=Totalt, M=Män, K=Kvinnor — standard är T
`;
