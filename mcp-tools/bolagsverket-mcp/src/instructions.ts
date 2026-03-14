/**
 * LLM instructions for the Bolagsverket MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Bolagsverket MCP — Instruktioner

Du har tillgång till 6 verktyg för att hämta företagsinformation från Bolagsverkets Värdefulla datamängder API.

## Verktyg

### Uppslag & Grunddata
- **bolagsverket_uppslag** — Slå upp organisation via org.nummer
- **bolagsverket_grunddata** — Detaljerad grunddata (adress, aktiekapital, firmateckning)

### Funktionärer
- **bolagsverket_styrelse** — Styrelseledamöter, VD, funktionärer

### Registrering
- **bolagsverket_registrering** — F-skatt, moms, arbetsgivare

### Dokument
- **bolagsverket_dokumentlista** — Lista inlämnade dokument (årsredovisningar)
- **bolagsverket_dokument** — Hämta specifikt dokument via ID

## BEGRÄNSNINGAR

- **Sökning ENBART via organisationsnummer** — namnbaserad sökning stöds EJ
- Organisationsnummer: 10 siffror (t.ex. "5566778899" eller "556677-8899")
- Rate limit: 60 anrop/minut
- Årsredovisningar: digitalt inlämnade från 2020 och framåt

## Arbetsflöde

1. Fråga alltid efter organisationsnummer — det krävs för alla anrop
2. Börja med \`bolagsverket_uppslag\` för att verifiera att organisationen finns
3. Hämta sedan detaljdata med lämpligt verktyg

## Tips

- Organisationsnummer kan anges med eller utan bindestreck
- OAuth 2.0-uppgifter krävs (BOLAGSVERKET_CLIENT_ID + BOLAGSVERKET_CLIENT_SECRET)
- Gratis registrering på gw.api.bolagsverket.se
- Cache: 1 timme organisation, 24 timmar dokument
`;
