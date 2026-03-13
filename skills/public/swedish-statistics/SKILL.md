---
name: swedish-statistics
description: Använd denna färdighet när användaren frågar om svensk statistik, svenska befolkningsdata, ekonomisk data för Sverige, svensk arbetsmarknad, svensk miljöstatistik, utbildningsstatistik, BNP, invånarantal i svenska kommuner/regioner, eller annan officiell statistik från SCB (Statistiska centralbyrån). Denna färdighet använder SCB MCP-verktygen för att hämta data direkt från SCB:s PxWebAPI 2.0.
---

# Svensk Statistik (SCB MCP v3.0)

## Översikt

Denna färdighet ger dig tillgång till Sveriges officiella statistik via SCB:s (Statistiska centralbyrån) PxWebAPI 2.0. Du har 1 200+ statistiktabeller med data om befolkning, ekonomi, miljö, arbetsmarknad och utbildning — 75+ års historisk data.

## Tillgängliga MCP-verktyg

| Verktyg | Typ | Beskrivning |
|---------|-----|-------------|
| `scb_search` | Discovery | Sök bland statistiktabeller med nyckelord |
| `scb_browse` | Discovery | Bläddra i SCB:s ämnesträd (ämnesområden, underämnen) |
| `scb_find_region_code` | Discovery | Slå upp regionkoder — fuzzy matching ("Goteborg" → "Göteborg", 1480) |
| `scb_search_regions` | Discovery | Sök bland alla 312 regioner (rike, län, kommuner) |
| `scb_inspect` | Inspection | Visa alla variabler, kodlistor och metadata för en tabell |
| `scb_codelist` | Inspection | Utforska en specifik variabels alla värden |
| `scb_fetch` | Data | Hämta data med auto-complete och markdown-tabell |
| `scb_preview` | Data | Förhandsgranska data (max ~50 rader) |
| `scb_validate` | Data | Validera en selektion utan att hämta data |
| `scb_check_usage` | Utility | Visa API-användning och rate limit |

## Arbetsflöde — 4 steg

### Steg 1: Sök rätt tabell

```
scb_search(query="befolkning kommun")
```

Sökningar fungerar bäst på **svenska**. Fuzzy matching stöds.

**Vanliga söktermer:**
- Befolkning: `"befolkning"`, `"folkmängd"`, `"invånare"`, `"medelålder"`
- Ekonomi: `"BNP"`, `"bruttonationalprodukt"`, `"inflation"`
- Arbetsmarknad: `"sysselsättning"`, `"arbetslöshet"`, `"förvärvsarbetande"`
- Miljö: `"utsläpp"`, `"växthusgaser"`, `"avfall"`
- Utbildning: `"studenter"`, `"utbildningsnivå"`

Alternativt, bläddra i ämnesträdet:
```
scb_browse(path="BE")  // BE = Befolkning, AM = Arbetsmarknad, NR = Nationalräkenskaper
```

### Steg 2: Slå upp regionkoder (om regiondata behövs)

Om frågan gäller en specifik kommun eller region:

```
scb_find_region_code(query="Göteborg")
```

Fuzzy matching: "Goteborg", "göteborg", "gbg" hittar alla "Göteborg" (1480).

Vanliga regionkoder:
- `"00"` = Hela riket
- `"0180"` = Stockholm
- `"1480"` = Göteborg
- `"1280"` = Malmö

### Steg 3: Inspektera tabellens variabler

```
scb_inspect(tableId="TAB637")
```

Detta visar alla dimensioner, deras värden och metadata. Använd `scb_codelist` om du behöver se alla värden för en specifik variabel.

### Steg 4: Hämta data

Gå **direkt** från inspect till fetch. `scb_fetch` har inbyggd **auto-complete** — saknade variabler fylls i automatiskt.

```
scb_fetch(tableId="TAB637", selection={"Region": ["1480"], "Kon": ["1+2"], "Tid": ["TOP(3)"]})
```

Resultatet innehåller ett `markdown_table`-fält — presentera detta direkt till användaren.

## KRITISKA REGLER

1. **Gå direkt från `scb_inspect` till `scb_fetch`** — hoppa över `scb_validate` (fetch har auto-complete)
2. **ALDRIG anropa samma verktyg mer än 2 gånger** — om det misslyckas, gå vidare till nästa steg eller svara med vad du har
3. **ALDRIG gissa regionkoder** — använd alltid `scb_find_region_code`
4. **Presentera `markdown_table` direkt** i svaret — skriv INTE filer
5. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults (senaste år, totalt)
6. **Sök på SVENSKA** — "befolkning" inte "population"

## Tips för variabelfiltrering

- `TOP(n)` — senaste n tidsperioderna: `"Tid": ["TOP(5)"]`
- `BOTTOM(n)` — äldsta n tidsperioderna
- `*` — alla värden: `"Region": ["*"]`
- Kombinera specifika värden: `"Tid": ["2022", "2023", "2024"]`

## Vanliga frågor — exempelarbetsflöden

### "Hur många bor i Borås?"

1. `scb_find_region_code(query="Borås")` → `"1490"`
2. `scb_search(query="folkmängd kommun")` → hitta tabell-ID
3. `scb_fetch(tableId="...", selection={"Region": ["1490"], "Tid": ["TOP(1)"]})` → data

### "Jämför befolkningen i Stockholm, Göteborg och Malmö"

1. `scb_find_region_code(query="Stockholm")` → `"0180"`
2. `scb_find_region_code(query="Göteborg")` → `"1480"`
3. `scb_find_region_code(query="Malmö")` → `"1280"`
4. `scb_search(query="folkmängd kommun")` → tabell-ID
5. `scb_fetch(tableId="...", selection={"Region": ["0180", "1480", "1280"], "Tid": ["TOP(5)"]})` → data

### "Visa BNP-utveckling de senaste 10 åren"

1. `scb_search(query="BNP bruttonationalprodukt")` → tabell-ID
2. `scb_inspect(tableId="...")` → se tillgängliga dimensioner
3. `scb_fetch(tableId="...", selection={"Tid": ["TOP(10)"]})` → data

## Presentera resultat

- Visa `markdown_table` direkt från `scb_fetch`-resultatet
- Inkludera trender och jämförelser när relevant
- Ange alltid källa: "Källa: SCB (Statistiska centralbyrån)"
- Förklara vad siffrorna betyder i kontext

## Felsökning

- **Tom sökning**: Prova synonymer eller bredare söktermer
- **Tabell hittades inte**: Kontrollera med `scb_search`
- **Regionkod okänd**: Använd `scb_find_region_code` — stödjer fuzzy matching
- **Många anrop**: Om du fastnar — **sluta loopa**, presentera vad du har hittills
