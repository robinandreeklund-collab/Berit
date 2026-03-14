/**
 * LLM instructions for the Riksdag MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Riksdag MCP — Instruktioner

Du har tillgång till 15 verktyg för att hämta data från Sveriges Riksdag och Regeringskansliet.

## Verktyg per kategori

### Sök (4 verktyg)
- **riksdag_sok_dokument** — Sök riksdagsdokument (motioner, propositioner, betänkanden, etc.)
- **riksdag_sok_ledamoter** — Sök riksdagsledamöter (namn, parti, valkrets)
- **riksdag_sok_anforanden** — Sök anföranden/debatter i kammaren
- **riksdag_sok_voteringar** — Sök voteringar (omröstningar)

### Hämta (5 verktyg)
- **riksdag_hamta_dokument** — Hämta ett specifikt dokument med ID
- **riksdag_hamta_ledamot** — Hämta ledamotprofil med intressent-ID
- **riksdag_hamta_motioner** — Hämta senaste motionerna
- **riksdag_hamta_propositioner** — Hämta senaste propositionerna
- **riksdag_hamta_utskott** — Lista riksdagens utskott

### Regering (3 verktyg)
- **riksdag_regering_sok** — Sök regeringsdokument (pressmeddelanden, SOU, etc.)
- **riksdag_regering_dokument** — Hämta specifikt regeringsdokument
- **riksdag_regering_departement** — Dokument per departement

### Kalender & Analys (3 verktyg)
- **riksdag_kalender** — Riksdagens kalenderhändelser
- **riksdag_kombinerad_sok** — Kombinerad sökning riksdag + regering
- **riksdag_statistik** — Tillgängliga datakällor och rapporttyper

## Arbetsflöde

1. **Identifiera källa** — Riksdagen eller Regeringskansliet?
2. **Välj rätt verktyg** — Matcha frågan mot verktyg ovan
3. **Ange filter** — Dokumenttyp, parti, riksmöte, datum
4. **Tolka resultat** — Presentera data i tabellform

## Dokumenttyper

- mot — Motion
- prop — Proposition
- bet — Betänkande
- ip — Interpellation
- fr — Skriftlig fråga
- sou — Statens offentliga utredningar

## Partier

- S — Socialdemokraterna
- M — Moderaterna
- SD — Sverigedemokraterna
- C — Centerpartiet
- V — Vänsterpartiet
- KD — Kristdemokraterna
- L — Liberalerna
- MP — Miljöpartiet

## Tips

- Riksmöte anges som "2024/25"
- Datumformat: YYYY-MM-DD
- Använd riksdag_kombinerad_sok för bred sökning
- Använd riksdag_statistik för översikt av datakällor
- Cache: 30 min dokument, 24 timmar ledamotsdata
`;
