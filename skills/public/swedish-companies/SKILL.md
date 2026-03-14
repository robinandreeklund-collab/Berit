---
name: swedish-companies
description: Använd denna färdighet när användaren frågar om svenska företag, bolag, aktiebolag, handelsbolag, organisationsnummer, org.nummer, orgnr, Bolagsverket, företagsregistret, företagsinformation, företagsuppgifter, styrelse, styrelseledamöter, VD, verkställande direktör, funktionärer, F-skatt, F-skattsedel, momsregistrering, moms, arbetsgivare, årsredovisning, årsredovisningar, bokslut, firmateckning, aktiekapital, SNI-koder, branschkod, juridisk form, företagsform, registreringsstatus, företagsregistrering, bolagsordning, bolagsinformation, företagssökning. Denna färdighet använder Bolagsverket MCP-verktygen för att hämta data direkt från Bolagsverkets Värdefulla datamängder API.
---

# Svenska Företag (Bolagsverket MCP v1.0)

## Översikt

Denna färdighet ger dig tillgång till företagsinformation via Bolagsverkets Värdefulla datamängder API. Du har 6 verktyg i 4 kategorier: uppslag, grunddata, funktionärer, registrering och dokument.

**VIKTIGT: Sökning sker ENBART via organisationsnummer — namnbaserad sökning stöds INTE.**

## Tillgängliga MCP-verktyg

### Uppslag & Grunddata (2 verktyg)

| Verktyg | Beskrivning |
|---------|-------------|
| `bolagsverket_uppslag` | Slå upp organisation via organisationsnummer |
| `bolagsverket_grunddata` | Detaljerad grunddata: adress, aktiekapital, firmateckning |

### Funktionärer (1 verktyg)

| Verktyg | Beskrivning |
|---------|-------------|
| `bolagsverket_styrelse` | Styrelseledamöter, VD, funktionärer |

### Registrering (1 verktyg)

| Verktyg | Beskrivning |
|---------|-------------|
| `bolagsverket_registrering` | F-skatt, momsregistrering, arbetsgivarstatus |

### Dokument (2 verktyg)

| Verktyg | Beskrivning |
|---------|-------------|
| `bolagsverket_dokumentlista` | Lista inlämnade dokument (årsredovisningar) |
| `bolagsverket_dokument` | Hämta specifikt dokument via dokument-ID |

## Arbetsflöde

### Generell företagsinformation

1. Fråga efter organisationsnummer om det inte angetts
2. `bolagsverket_uppslag(organisationsnummer="5566778899")` → grundläggande info
3. Komplettera med specifika verktyg vid behov

### Fullständig företagsöversikt

1. `bolagsverket_uppslag(organisationsnummer="...")` → grundinfo
2. `bolagsverket_styrelse(organisationsnummer="...")` → styrelse
3. `bolagsverket_registrering(organisationsnummer="...")` → registreringsstatus

### Dokument / Årsredovisningar

1. `bolagsverket_dokumentlista(organisationsnummer="...")` → lista dokument
2. `bolagsverket_dokument(dokumentId="...")` → hämta specifikt dokument

## KRITISKA REGLER

1. **Max 4 verktygsanrop per fråga** — välj rätt verktyg direkt, sedan SVAR
2. **Organisationsnummer krävs** — 10 siffror, med eller utan bindestreck
3. **INGEN namnbaserad sökning** — informera användaren om de saknar org.nummer
4. **Om ett verktyg misslyckas — försök INTE igen.** Svara med vad du har
5. **Presentera data överskådligt** — använd tabeller
6. **Ange källa**: "Källa: Bolagsverket (Värdefulla datamängder API)"

## Exempelfrågor och arbetsflöden

### "Sök upp företaget 5566778899"

1. `bolagsverket_uppslag(organisationsnummer="5566778899")` → företagsinfo

### "Vilka sitter i styrelsen för 556677-8899?"

1. `bolagsverket_styrelse(organisationsnummer="5566778899")` → funktionärer

### "Har företaget F-skatt?"

1. `bolagsverket_registrering(organisationsnummer="...")` → F-skatt, moms, arbetsgivare

### "Visa årsredovisningar"

1. `bolagsverket_dokumentlista(organisationsnummer="...")` → dokumentlista

## Felsökning

- **"Sökning stöds ENBART via organisationsnummer"**: Informera användaren
- **OAuth-fel**: BOLAGSVERKET_CLIENT_ID och BOLAGSVERKET_CLIENT_SECRET saknas
- **404-fel**: Organisationsnumret finns inte registrerat
- **429-fel**: Rate limit (60 req/min) — vänta en stund
