---
name: swedish-economy
description: Använd denna färdighet när användaren frågar om svensk ekonomi, räntor, styrränta, reporänta, STIBOR, obligationsräntor, bostadsräntor, valutakurser, kronkursen, SEK, EUR/SEK, USD/SEK, SWESTR, dagslåneränta, referensränta, inflation, KPI, KPIF, BNP, tillväxt, makroekonomi, arbetslöshet, Riksbanken, penningpolitik, eller prognoser från Riksbanken. Denna färdighet använder Riksbank MCP-verktygen för att hämta data direkt från Riksbankens öppna REST-API:er.
mcp-servers: [riksbank]
---

# Svensk Ekonomi (Riksbank MCP v1.0)

## Översikt

Denna färdighet ger dig tillgång till ekonomisk data via Sveriges Riksbanks tre öppna API:er. Du har 8 verktyg i 4 kategorier: räntor, valuta, SWESTR och prognoser.

## Tillgängliga MCP-verktyg

### Räntor (Styrränta, Marknadsräntor)

| Verktyg | Beskrivning |
|---------|-------------|
| `riksbank_ranta_styrranta` | Hämta aktuell styrränta (reporänta) och historik |
| `riksbank_ranta_marknadsrantor` | Hämta marknadsräntor: STIBOR, statsobligationer, bostadsräntor |

### Valuta (Kurser, Korskurser)

| Verktyg | Beskrivning |
|---------|-------------|
| `riksbank_valuta_kurser` | Hämta aktuella och historiska valutakurser mot SEK |
| `riksbank_valuta_korskurser` | Beräkna korskurs mellan två valutor via SEK |

### SWESTR (Dagslåneränta)

| Verktyg | Beskrivning |
|---------|-------------|
| `riksbank_swestr` | Hämta SWESTR — svensk dagslåneränta (referensränta) |

### Prognoser (Inflation, BNP, Makro)

| Verktyg | Beskrivning |
|---------|-------------|
| `riksbank_prognos_inflation` | Hämta Riksbankens inflationsprognoser (KPI, KPIF) |
| `riksbank_prognos_bnp` | Hämta Riksbankens BNP-prognoser |
| `riksbank_prognos_ovrigt` | Hämta övriga makroprognoser eller lista indikatorer |

## Arbetsflöde

### Frågor om räntor

1. Identifiera: styrränta eller marknadsräntor?
2. Styrränta → `riksbank_ranta_styrranta` (med fromDate/toDate för historik)
3. STIBOR/obligationer → `riksbank_ranta_marknadsrantor` (groupId: "3" för STIBOR, "2" för styrräntor)

### Frågor om valutakurser

1. Specifik valuta → `riksbank_valuta_kurser` med valuta-parameter ("EUR", "USD")
2. Alla valutor → `riksbank_valuta_kurser` utan parameter
3. Korskurs → `riksbank_valuta_korskurser` med valuta1 + valuta2

### Frågor om SWESTR

1. Aktuell → `riksbank_swestr` utan parametrar
2. Historik → `riksbank_swestr` med fromDate + toDate

### Frågor om prognoser

1. Inflation → `riksbank_prognos_inflation` (default: KPIF)
2. BNP → `riksbank_prognos_bnp`
3. Övriga/lista → `riksbank_prognos_ovrigt`

## Viktiga serie-ID:n

| Serie-ID | Beskrivning |
|----------|-------------|
| SECBREPOEFF | Styrränta (reporänta) |
| SEKEURPMI | EUR/SEK |
| SEKUSDPMI | USD/SEK |

## KRITISKA REGLER

1. **Max 4 verktygsanrop per fråga** — välj rätt verktyg direkt, sedan SVAR
2. **Datumformat: YYYY-MM-DD** — "2024-01-15"
3. **Om ett verktyg misslyckas — försök INTE igen.** Svara med vad du har
4. **Presentera data överskådligt** — använd tabeller
5. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults
6. **Ange källa**: "Källa: Sveriges Riksbank"

## Exempelfrågor och arbetsflöden

### "Vad är styrräntan?"

1. `riksbank_ranta_styrranta()` → senaste reporäntan

### "Hur står kronan mot euron?"

1. `riksbank_valuta_kurser(valuta="EUR")` → EUR/SEK

### "Visa inflationsprognosen"

1. `riksbank_prognos_inflation()` → KPIF-prognos

### "SWESTR idag"

1. `riksbank_swestr()` → aktuell dagslåneränta

## Felsökning

- **Tom sökning**: Kontrollera serie-ID eller indikator-ID
- **429-fel**: API:t är överbelastat, vänta en stund
- **404-fel**: Serie eller indikator finns inte — kontrollera ID:t
